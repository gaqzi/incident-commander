import { ActiveActions } from './actions.mjs'
import { AffectedSystems } from './affected-systems.mjs'
import { config } from './config.mjs'
import { Countdown, CountdownDisplay } from './countdown.mjs'
import { EventDispatcher, uniqueishId } from './events.mjs'

// No idea what the practice here is, do we put in the definition in the
// module or in main? I'm going with main for now so all the custom
// components are declared in one place, but it feels weird
customElements.define('countdown-display', CountdownDisplay)
customElements.define('countdown-timer', Countdown)

customElements.define('affected-systems', AffectedSystems)

/******* The stuff from index.html unchanged *******/
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
  let data = {}
  for (let en of form) {
    data[en[0]] = en[1]
  }

  return data
}

const events = new EventDispatcher(document.body, uniqueishId)

document.querySelectorAll('.update-summary').forEach((el) => {
  // Whenever the input changes update the summary, using 'input' because seeing the summary change feels worthwhile.
  let summary = document.querySelector('incident-summary')
  el.addEventListener('input', e => summary.setAttribute(e.target.name, e.target.value))
})

// Hide / show the incident summary
document.querySelector('.incident-summary form').addEventListener('submit', e => {
  e.preventDefault()

  onElement(document.querySelector('.incident-summary form'), el => el.addEventListener('change', e => {
    console.log(`changed summary: ${JSON.stringify(objectFromForm(new FormData(e.currentTarget)))}`)
  }))

  let data = objectFromForm(new FormData(e.currentTarget))
  data.status = config.statuses[0]
  events.createIncident(data)
  events.newAffectedSystem({ name: data.what })
})

events.eventTarget.addEventListener('CreateIncident', e => {
  let summary = document.querySelector('section.incident-summary')
  onElement(summary, el => el.classList.add('closed'))
  onElement(summary.querySelector('[type="submit"]'), el => el.innerHTML = 'Hide')
  onElement(document.querySelector('#newActionWhat'), el => el.focus())

  let useDefaultActions = summary.querySelector('#use_default_actions').checked
  if (!useDefaultActions) return

  config.defaultActions.forEach(action => events.createAction({
    type: 'ACTION',
    what: action,
    who: 'TBD',
    expireIntervalMinutes: '10',
  }))
})

document.querySelector('.incident-summary h1').addEventListener('click', e => {
  onElement(findParentElementWithClass(e.target, 'incident-summary'), el => el.classList.toggle('closed'))
})

// Actions
document.querySelector('.actions__add form').addEventListener('submit', e => {
  e.preventDefault()

  let data = objectFromForm(new FormData(e.currentTarget))
  data.type = data.isAction ? 'ACTION' : 'TASK'
  delete data.isAction
  events.createAction(data)

  e.currentTarget.reset()
})

customElements.define('active-action', ActiveActions)

document.body.addEventListener('CreateAction', e => {
  let item = document.createElement('li')
  item.innerHTML = `<active-action
        type="${e.detail.details.type}"
        what="${e.detail.details.what}"
        who="${e.detail.details.who}"
        link="${e.detail.details.link || ''}"
        createdAt="${e.detail.recordedAt}"
        expireIntervalMinutes="${e.detail.details.expireIntervalMinutes}" id="${e.detail.id}"></active-action>`
  item.children[0].eventDispatcher = events

  document.querySelector('.actions__active ul').appendChild(item)
})

class IncidentSummary extends HTMLElement {
  /**
   *
   * @param {string} id
   * @param {EventDispatcher} eventDispatcher
   */
  constructor (id, eventDispatcher) {
    super()
    this.id = id
    this.eventDispatcher = eventDispatcher

    this.el = document.getElementById('incident-summary').content.cloneNode(true)
    this.appendChild(this.el)

    for (let attr of IncidentSummary.observedAttributes) {
      this.querySelector(`.${attr}`).addEventListener('contextmenu', e => {
        e.preventDefault()

        let currentVal = this.getAttribute(attr)
        let newVal = null
        if (attr === 'status') { // XXX: blergh, but making nicer later!
          currentVal = config.statuses.map(s => s === currentVal ? `[${s}]` : s).join(' / ')
          let first = true
          do {
            newVal = prompt('New value' + first ? '' : ', need to pick a valid status', currentVal)
            first = false
            if (newVal === null) continue
            newVal = newVal.trim()
          } while (!config.statuses.includes(newVal))
        } else {
          newVal = prompt('New value', currentVal)
          if (newVal === null) return
        }

        let data = {}
        data[attr] = newVal
        this.eventDispatcher.updateIncident(this.id, data)
      })
    }

    this.eventDispatcher.eventTarget.addEventListener('UpdateIncident', e => {
      for (let kv of Object.entries(e.detail.details)) {
        this.setAttribute(kv[0], kv[1])
      }
    })
  }

  static get observedAttributes () { return ['what', 'when', 'where', 'impact', 'status'] }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue === newValue) return

    this.querySelector(`.message .${name}`).innerText = newValue
  }
}

customElements.define('incident-summary', IncidentSummary)

let createIncidentHandler = e => {
  let is = new IncidentSummary(e.detail.id, events)
  for (let kv of Object.entries(e.detail.details)) {
    is.setAttribute(kv[0], kv[1])
  }
  document.querySelector('.incident-summary header').append(is)
  document.body.removeEventListener('CreateIncident', createIncidentHandler)
}
document.body.addEventListener('CreateIncident', createIncidentHandler)

document.body.addEventListener('FinishAction', e => {
  let recordedAt = e.detail.recordedAt
  let previousAction = document.querySelector(`.actions__active [id="${e.detail.id}"]`)

  let status = '❌'
  if (e.detail.details.resolution === 'SUCCESSFUL') {
    status = e.detail.details.type === 'ACTION' ? '✅' : '✔️'
  }

  let pastActions = document.querySelector('.actions__past ul')
  let li = document.createElement('li')

  let hours = recordedAt.getUTCHours()
  if (hours < 10) hours = `0${hours}`

  let moreDetails = '<ul>'
  let details = e.detail.details.reason || ''
  if (details) moreDetails += `<li>${details}</li>`

  let link = previousAction.attributes.getNamedItem('link').value
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

let notificationToggle = document.querySelector('#notificationsEnabled')
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

/********* Debug & bootstrap *********/

document.querySelector('.affected-systems')
  .appendChild(new AffectedSystems(events))

Array.of(
  'CreateIncident', 'UpdateIncident',
  'CreateAction', 'UpdateAction', 'FinishAction',
  'NewAffectedSystem', 'ResolvedAffectedSystem',
).forEach(eventName => {
  document.body.addEventListener(eventName, e => {
    console.log(e)
  })
})

// Populate some example data
events.createIncident({
  what: 'Paypal unavailable',
  where: 'TW',
  when: '10:00 UTC',
  impact: '2% of orders 100% of Paypal customers',
  status: 'Investigating',
})

const paypalUnavailableSystem = events.newAffectedSystem({
  name: 'Paypal unavailable',
})

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

// TODO: Implement finish action, two states/types: "success/no info needed" and "info needed", need to write about this to figure out the naming here
//       the active actions list should be a component that is responsible for creating the new actions and then removing them as they finish.
//       The action item publishes events as there are interactions
// TODO: Display finished actions
// TODO: turn the summary portion into an element that listens to the update events and update itself
// TODO: implement the detailed summary views
// TODO: Store the incident and its state in localStorage, under a created incident id
// TODO: Rehydrate from localStorage
