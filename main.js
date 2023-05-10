import { ActiveActions } from './actions.mjs'
import { AffectedSystems } from './affected-systems.mjs'
import { config } from './config.mjs'
import { Countdown, CountdownDisplay } from './countdown.mjs'
import { IncidentSummary } from './incident-summary.mjs'
import { EventDispatcher, MultiPlayerEventList, SinglePlayerEventList } from './event-bus.mjs'
import { UpdatesSection } from './updates.mjs'
import { NewIndexedDB } from './storage.mjs'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'


// No idea what the practice here is, do we put in the definition in the
// module or in main? I'm going with main for now so all the custom
// components are declared in one place, but it feels weird
customElements.define('countdown-display', CountdownDisplay)
customElements.define('countdown-timer', Countdown)
customElements.define('affected-systems', AffectedSystems)
customElements.define('updates-section', UpdatesSection)
customElements.define('incident-summary', IncidentSummary)

/** ***** The stuff from index.html unchanged *******/
function onElement (el, fn) {
  if (el == null) return

  fn(el)
}

function findParentElementWithClass (e, className) {
  if (e == null) return null
  if (e.classList.contains(className)) return e

  return findParentElementWithClass(e.parentElement, className)
}

function objectFromForm (form) {
  const data = {}
  for (const en of form) {
    data[en[0]] = en[1]
  }

  return data
}

/**
 * Registers the listener for all events for the EventDispatcher so all events can be stored.
 * @param {EventDispatcher} events
 * @param {Storage} storage
 */
function StoreEvents (events, storage) {
  events.addListener(EventDispatcher.ALL_EVENTS, (e) => {
    // XXX: this should be on some global object that contains the "live current stuff," but,
    //  until that's in place, let's just hack it!
    if (e.name === 'CreateIncident') {
      window._currentIncidentId = e.id
    }

    storage.add(window._currentIncidentId, e).catch((reason) => console.log(`failed to store received event: ${JSON.stringify(reason)}`))
  })
}

function setupMultiplayer (ydoc) {
  const signaling = [process.env.WEBRTC_SIGNALING_SERVER] // injected via parcel. see README for more info

  // If we don't have a room and password, create them and refresh window so they're on the query string
  const params = new URLSearchParams(window.location.search)
  if (!params.get('room')) {
    params.set('room', new Date().valueOf())
  }
  if (!params.get('password')) {
    params.set('password', parseInt(Math.random() * 10e5, 10))
  }
  if ((new URLSearchParams(window.location.search)).toString() !== params.toString()) {
    window.location.search = params.toString()
  }

  const room = params.get('room')
  const password = params.get('password')

  // trying STUN to get peers happy
  const peerOpts = {
    config: {
      iceServers: [
        {urls: process.env.WEBRTC_SIGNALING_SERVER, username: 'username', credential: 'passwd'},
      ]
    }

  }
  const websocketProvider = new WebsocketProvider(process.env.YJS_SOCKET_SERVER, room, ydoc)
  websocketProvider.on('status', event => {
    console.log('YJS WebSocket Provider: ', event.status) // logs "connected" or "disconnected"
  })
  // TODO: If we can't connect to the socket server, show an error dialog for now I guess?
}

// Bypass inability for top-level await in Parcel (which we use for bundling YJS) by wrapping all our top-level await usage in an async IIFE
(async () => {
  const db = await NewIndexedDB(window.indexedDB)
  window._db = db

  let eventList
  const params = new URLSearchParams(window.location.search)
  if (params.get('disableMultiplayer')) {
    eventList = new SinglePlayerEventList()
  } else {
    // Multi-user collab events with YJS
    const ydoc = new Y.Doc()
    setupMultiplayer(ydoc)
    eventList = new MultiPlayerEventList(ydoc.get('events', Y.Array))
  }

  const events = new EventDispatcher(null, null, eventList)
  StoreEvents(events, db)

  // DEBUG
  // events.addListener(EventDispatcher.ALL_EVENTS, e => console.log(e))

  // Hide / show the incident summary
  document.querySelector('.incident-summary form').addEventListener('submit', e => {
    e.preventDefault()

    onElement(document.querySelector('.incident-summary form'), el => el.addEventListener('change', e => {
      console.log(`changed summary: ${JSON.stringify(objectFromForm(new FormData(e.currentTarget)))}`)
    }))

    const data = objectFromForm(new FormData(e.currentTarget))
    data.status = config.statuses[0]
    events.createIncident(data)

    if (data.use_default_actions) {
      config.defaultActions.forEach(action => {
        events.createAction({
          type: 'ACTION',
          what: action,
          who: 'TBD',
          expireIntervalMinutes: '10'
        })
      })
    }

    events.newAffectedSystem({ name: data.what })
  })

  customElements.define('active-action', ActiveActions)

  events.addListener('CreateAction', e => {
    const item = document.createElement('li')
    item.innerHTML = `<active-action
        type="${e.details.type}"
        what="${e.details.what}"
        who="${e.details.who}"
        link="${e.details.link || ''}"
        createdAt="${e.recordedAt}"
        expireIntervalMinutes="${e.details.expireIntervalMinutes}" id="${e.id}"></active-action>`
    item.children[0].eventDispatcher = events

    document.querySelector('.actions__active ul').appendChild(item)
  })

  events.addListener('CreateIncident', e => {
    const summary = document.querySelector('section.incident-summary')
    onElement(summary, el => el.classList.add('closed'))
    onElement(summary.querySelector('[type="submit"]'), el => { el.innerHTML = 'Hide' })
    onElement(document.querySelector('#newActionWhat'), el => el.focus())

    document.querySelectorAll('.update-summary').forEach((el) => {
      // Whenever the input changes update the summary, using 'input' because seeing the summary change feels worthwhile.
      const summary = document.querySelector('incident-summary')
      el.addEventListener('input', e => summary.setAttribute(e.target.name, e.target.value))
    })
  })

  document.querySelector('.incident-summary h1').addEventListener('click', e => {
    onElement(findParentElementWithClass(e.target, 'incident-summary'), el => el.classList.toggle('closed'))
  })

  // Actions
  document.querySelector('.actions__add form').addEventListener('submit', e => {
    e.preventDefault()

    const data = objectFromForm(new FormData(e.currentTarget))
    data.type = data.isAction ? 'ACTION' : 'TASK'
    delete data.isAction
    events.createAction(data)

    e.currentTarget.reset()
  })

  const createIncidentHandler = e => {
    const is = new IncidentSummary(e.id, events)
    for (const kv of Object.entries(e.details)) {
      is.setAttribute(kv[0], kv[1])
    }
    document.querySelector('.incident-summary header').append(is)
    // XXX: This structure is not nice, maybe I should be instantiating this inside?
    //  The code layout here isn't nice.
    is.querySelector('.incident-summary__actions').appendChild(new UpdatesSection(events))
    document.body.removeEventListener('CreateIncident', createIncidentHandler)
  }
  events.addListener('CreateIncident', createIncidentHandler)

  events.addListener('FinishAction', e => {
    const recordedAt = new Date(e.recordedAt)
    const previousAction = document.querySelector(`.actions__active [id="${e.actionId}"]`)

    let status = '❌'
    if (e.details.resolution === 'SUCCESSFUL') {
      status = e.details.type === 'ACTION' ? '✅' : '✔️'
    }

    const pastActions = document.querySelector('.actions__past ul')
    const li = document.createElement('li')

    let hours = recordedAt.getUTCHours()
    if (hours < 10) hours = `0${hours}`

    let moreDetails = '<ul>'
    const details = e.details.reason || ''
    if (details) moreDetails += `<li>${details}</li>`

    const link = previousAction.attributes.getNamedItem('link').value
    if (link !== '') moreDetails += `<li><a href="${link}" class="external" target="_blank">More information</a></li>`
    moreDetails += '</ul>'

    if (moreDetails.length <= 9) moreDetails = ''

    li.innerHTML = `
        <time datetime="${recordedAt.toISOString()}">${hours}:${recordedAt.getUTCMinutes()}</time>
        ${status} (${previousAction.attributes.getNamedItem('who').value}) ${previousAction.attributes.getNamedItem('what').value}
        ${moreDetails}
    `
    pastActions.appendChild(li)

    previousAction.parentElement.remove()
  })

  const notificationToggle = document.querySelector('#notificationsEnabled')
  notificationToggle.checked = Notification.permission === 'granted'
  notificationToggle.addEventListener('change', e => {
    if (e.target.checked) {
      switch (Notification.permission) {
        case 'granted':
          return
        default:
          Notification.requestPermission().then(newPermission => {
            e.target.checked = newPermission === 'granted'
          })
      }
    }

    e.target.checked = false
  })

  document.querySelector('.affected-systems')
    .appendChild(new AffectedSystems(events))

  /** ******* Debug & bootstrap *********/
  function createDebugIncident () {
    // Populate some example data
    events.createIncident({
      what: 'Paypal unavailable',
      where: 'TW',
      when: '10:00 UTC',
      impact: '2% of orders 100% of Paypal customers',
      status: 'Investigating'
    })

    config.defaultActions.forEach(action => {
      events.createAction({
        type: 'ACTION',
        what: action,
        who: 'TBD',
        expireIntervalMinutes: '10'
      })
    })

    events.newAffectedSystem({ name: 'Paypal unavailable' })

    const failedAction = events.createAction({
      type: 'ACTION',
      what: 'Has there been a rip in spacetime?',
      who: 'Peter',
      expireIntervalMinutes: 10
    })
    events.finishAction(failedAction.id, {
      type: 'ACTION',
      resolution: 'FAILED',
      reason: 'No recent Dalek or Cybermen activity, and no signs of a blue box.'
    })

    const successAction = events.createAction({
      type: 'TASK',
      what: 'Escalating to CTO',
      who: 'Björn',
      expireIntervalMinutes: '10'
    })
    events.finishAction(successAction.id, {
      type: 'TASK',
      resolution: 'SUCCESSFUL'
    })

    const resolvedSystem = events.newAffectedSystem({ name: 'Peering with Comcast' })
    events.resolveAffectedSystem(resolvedSystem.id, { type: 'SUCCESS' })
  }

  document.querySelector('button#debug-create-incident').addEventListener('click', e => {
    createDebugIncident()
  })
})() // ends our top level asyync IIFE

// TODO: Implement finish action, two states/types: "success/no info needed" and "info needed", need to write about this to figure out the naming here
//       the active actions list should be a component that is responsible for creating the new actions and then removing them as they finish.
//       The action item publishes events as there are interactions
// TODO: Display finished actions
// TODO: turn the summary portion into an element that listens to the update events and update itself
// TODO: implement the detailed summary views
// TODO: Store the incident and its state in localStorage, under a created incident id
// TODO: Rehydrate from localStorage
