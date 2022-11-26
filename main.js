import { Countdown, CountdownDisplay } from './countdown.mjs'

// No idea what the practice here is, do we put in the definition in the
// module or in main? I'm going with main for now so all the custom
// components are declared in one place, but it feels weird
customElements.define('countdown-display', CountdownDisplay)
customElements.define('countdown-timer', Countdown)

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

// It's not perfect, ideally it'd just be a UUID but until this thing becomes more production it'll do for a single user's need.
function uniqueishId (prefix) {
  prefix = prefix ? `${prefix}:` : ''
  return prefix + (Date.now() + Math.random()).toString(36)
}

class EventDispatcher {
  constructor (eventTarget, idCreator) {
    this.eventTarget = eventTarget || document.body
    this.idCreator = idCreator
  }

  _dispatch (name, detail) {
    detail.name = name
    detail.recordedAt = detail.recordedAt || new Date()

    this.eventTarget.dispatchEvent(new CustomEvent(name, {
      detail: detail,
      bubbles: false, // bubbles to parent DOM elements?
      cancelable: true,
      composed: false // bubbles out of the shadow DOM?
    }))

    return detail
  }

  createIncident (data) {
    return this._dispatch('CreateIncident', { id: this.idCreator('i'), details: data })
  }

  createAction (data) {
    return this._dispatch('CreateAction', { id: this.idCreator('a'), details: data })
  }

  finishAction (id, data) {
    return this._dispatch('FinishAction', { id: id, details: data })
  }
}

const events = new EventDispatcher(document.body, uniqueishId)

document.querySelectorAll('.update-summary').forEach((el) => {
  // Whenever the input changes update the summary, using 'input' because seeing the summary change feels worthwhile.
  let summary = document.querySelector('incident-summary')
  el.addEventListener('input', e => summary.setAttribute(e.target.name, e.target.value))

  // If we have something set in the browser from a previous instance then set the summary
  if (el.value !== '') { // TODO: remove when replaying events for persistence
    summary.setAttribute(el.name, el.value)
  }
})

// Hide / show the incident summary
document.querySelector('.incident-summary form').addEventListener('submit', e => {
  e.preventDefault()

  onElement(document.querySelector('.incident-summary form'), el => el.addEventListener('change', e => {
    console.log(`changed summary: ${JSON.stringify(objectFromForm(new FormData(e.currentTarget)))}`)
  }))

  events.createIncident(objectFromForm(new FormData(e.currentTarget)))

  onElement(findParentElementWithClass(e.target, 'incident-summary'), el => el.classList.add('closed'))
  onElement(e.target.querySelector('[type="submit"]'), el => el.innerHTML = 'Hide')
  onElement(document.querySelector('#newActionWhat'), el => el.focus())
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

customElements.define('active-action', class extends HTMLElement {
  constructor () {
    super()
    let template = document.getElementById('actions__active__item').content

    template.querySelector('.description').textContent = `(${this.getAttribute('who')}) ${this.getAttribute('what')}`

    let createdAt = Date.parse(this.getAttribute('createdAt')),
      interval = parseInt(this.getAttribute('expireIntervalMinutes'), 10),
      expiresAt = new Date(createdAt + (interval * 60_000))

    let countdown = template.querySelector('countdown-timer')
    countdown.setAttribute('to', expiresAt.toISOString())
    countdown.setAttribute('interval-minutes', interval)

    template.querySelector('input[name="is_action"]').checked = this.getAttribute('type') === 'ACTION'
    template.querySelector('input[name="is_action"]').addEventListener('change', e => {
      if (e.target.checked)
        this.setAttribute('type', 'ACTION')
      else
        this.setAttribute('type', 'TASK')
    })

    let shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(template.cloneNode(true))

    shadowRoot.querySelectorAll('button.finish').forEach(el => el.addEventListener('click', e => {
        // Feels like there's a need for a third button, one for incident mitigated/resolved
        let finishStatus = e.target.classList.contains('success') ? 'SUCCESSFUL' : 'FAILED'
        let type = shadowRoot.querySelector('input[name="is_action"]').checked ? 'ACTION' : 'TASK'

        let reason = undefined
        if (finishStatus === 'FAILED') {
          reason = prompt('Why did this action fail?')
          if (reason === null) return
        }

        events.finishAction(this.getAttribute('id'), {
          type: type,
          resolution: finishStatus,
          reason: reason
        })
      })
    )

    shadowRoot.querySelector('button[name="pushTimer"]').addEventListener('click', e => {
      shadowRoot.querySelector('countdown-timer').restart()
    })
    shadowRoot.querySelector('button[name="pushTimer"]').addEventListener('contextmenu', e => {
      e.preventDefault()

      let interval = prompt('How many minutes do you want to count down to instead?', '20')
      if (interval === null) return

      let newInterval = Number.parseInt(interval, 10)
      if (Number.isNaN(newInterval)) {
        alert('Failed to parse "' + interval + '" into a number')
        return
      }
      if (newInterval < 1) {
        alert('Expected to count down at least 1 minute, got: "' + interval + '"')
        return
      }

      shadowRoot.querySelector('countdown-timer').setAttribute('interval-minutes', interval)
    })
  }
})

document.body.addEventListener('CreateAction', e => {
  let item = document.createElement('li')
  item.innerHTML = `<active-action
        type="${e.detail.details.type}"
        what="${e.detail.details.what}"
        who="${e.detail.details.who}"
        createdAt="${e.detail.recordedAt}"
        expireIntervalMinutes="${e.detail.details.expireIntervalMinutes}" id="${e.detail.id}"></active-action>`

  document.querySelector('.actions__active ul').appendChild(item)
})

class IncidentSummary extends HTMLElement {
  constructor () {
    super()

    this.el = document.getElementById('incident-summary').content.cloneNode(true)
    this.appendChild(this.el)
  }

  static get observedAttributes () { return ['what', 'when', 'where', 'impact'] }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue === newValue) return

    this.querySelector(`.message .${name}`).innerText = newValue
  }
}

customElements.define('incident-summary', IncidentSummary)

document.body.addEventListener('CreateIncident', e => {
  let el = document.querySelector('incident-summary')

  el.setAttribute('what', e.detail.details.what)
  el.setAttribute('where', e.detail.details.where)
  el.setAttribute('when', e.detail.details.when)
  el.setAttribute('impact', e.detail.details.impact)
})

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

  let details = e.detail.details.reason || ''
  if (details) details = `<ul><li>${details}</li></ul>`

  li.innerHTML = `
        <time datetime="${recordedAt.toISOString()}">${hours}:${recordedAt.getUTCMinutes()}</time>
        ${status} (${previousAction.attributes.getNamedItem('who').value}) ${previousAction.attributes.getNamedItem('what').value}
        ${details}
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
Array.of('CreateIncident', 'CreateAction', 'FinishAction').forEach(eventName => {
  document.body.addEventListener(eventName, e => {
    console.log(e)
  })
})

// Populate some example data
events.createIncident({
  what: 'Paypal unavailable',
  where: 'TW',
  when: '10:00 UTC',
  impact: '2% of orders 100% of Paypal customers'
})

const failedAction = events.createAction({
  type: 'ACTION',
  what: 'Is there a related infrastructure change?',
  who: 'Peter',
  expireIntervalMinutes: 10
})
events.finishAction(failedAction.id, {
  type: 'ACTION',
  resolution: 'FAILED',
  reason: 'No new infrastructure changes applied in the last 4 hours.'
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

const ongoingAction = events.createAction({
  type: 'ACTION',
  what: 'Has there been any recent deploys?',
  who: 'John',
  expireIntervalMinutes: 10
})

// TODO: Implement finish action, two states/types: "success/no info needed" and "info needed", need to write about this to figure out the naming here
//       the active actions list should be a component that is responsible for creating the new actions and then removing them as they finish.
//       The action item publishes events as there are interactions
// TODO: Display finished actions
// TODO: turn the summary portion into an element that listens to the update events and update itself
// TODO: implement the detailed summary views
// TODO: Store the incident and its state in localStorage, under a created incident id
// TODO: Rehydrate from localStorage
