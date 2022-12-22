export class ActiveActions extends HTMLElement {
  constructor () {
    super()
    this.id = this.getAttribute('id')
    let template = document.getElementById('actions__active__item').content

    let expiresAt = this.getAttribute('expiresAt'),
      interval = parseInt(this.getAttribute('expireIntervalMinutes'), 10)
    if (expiresAt === null) {
      let createdAt = Date.parse(this.getAttribute('createdAt'))

      expiresAt = new Date(createdAt + (interval * 60_000)).toISOString()
      this.setAttribute('expiresAt', expiresAt)
    }

    let shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(template.cloneNode(true))

    this.countdown = shadowRoot.querySelector('countdown-timer')

    for (let el of ['link', 'who', 'what']) {
      shadowRoot.querySelector('.description').querySelector(`.${el}`).addEventListener('contextmenu', e => {
        e.preventDefault()
        let value = prompt('What do you want to change to?', this.getAttribute(el))

        let data = {}
        data[el] = value
        this.eventDispatcher.updateAction(this.id, data)
      })
    }

    shadowRoot.querySelector('input[name="is_action"]').addEventListener('change', e => {
      this.eventDispatcher.updateAction(this.id, { type: e.target.checked ? 'ACTION' : 'TASK' })
    })

    shadowRoot.querySelectorAll('button.finish').forEach(el => el.addEventListener('click', e => {
        // Feels like there's a need for a third button, one for incident mitigated/resolved
        let finishStatus = e.target.classList.contains('success') ? 'SUCCESSFUL' : 'FAILED'
        let type = shadowRoot.querySelector('input[name="is_action"]').checked ? 'ACTION' : 'TASK'

        let reason = undefined
        if (finishStatus === 'FAILED') {
          reason = prompt('Why did this action fail?')
          if (reason === null) return
        }

        this.eventDispatcher.finishAction(this.id, {
          type: type,
          resolution: finishStatus,
          reason: reason
        })
      })
    )

    shadowRoot.querySelector('button[name="pushTimer"]').addEventListener('click', e => {
      // let countdown = shadowRoot.querySelector('countdown-timer')
      this.countdown.restart()
      this.eventDispatcher.updateAction(this.id, { expiresAt: this.countdown.getAttribute('to') })
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

      this.countdown.setAttribute('interval-minutes', interval)
      this.eventDispatcher.updateAction(this.id, {
        expireIntervalMinutes: interval.toString(),
        expiresAt: this.countdown.getAttribute('to'),
      })
    })
  }

  /** @param {EventDispatcher} v */
  set eventDispatcher (v) {
    if (this._eventDispatcher !== undefined) return

    this._eventDispatcher = v

    let that = this
    this._updateEventDispatcher = e => {
      if (e.id !== that.id) return

      for (let item of Object.entries(e.details)) {
        that.setAttribute(item[0], item[1])
      }
    }

    this._eventDispatcher.addListener('UpdateAction', this._updateEventDispatcher)
  }

  /** @return EventDispatcher */
  get eventDispatcher () { return this._eventDispatcher }

  /* To remove all the callback listeners when the action is inactive to avoid pointless work */
  connectedCallback () { this._eventDispatcher.addListener('UpdateAction', this._updateEventDispatcher) }

  disconnectedCallback () { this.eventDispatcher.removeListener('UpdateAction', this._updateEventDispatcher) }

  static get observedAttributes () {
    return [
      'who', 'what', 'type',
      'link',
      'expiresat', 'expireintervalminutes',
    ]
  }

  attributeChangedCallback (name, _, newValue) {
    switch (name) {
      case 'type':
        this.shadowRoot.querySelector('input[name="is_action"]').checked = newValue === 'ACTION'
        break

      case 'link':
        let link = this.shadowRoot.querySelector('.description .link')
        if (newValue === '') {
          link.innerText = 'Link missing'
          break
        }
        link.innerHTML = `<a href="${newValue}" class="external" target="_blank">More information</a>`
        break

      case 'what':
      case 'who':
        this.shadowRoot.querySelector(`.description .${name}`).innerText = newValue
        break

      // Countdown stuff
      case 'expiresat':
        this.countdown.setAttribute('expiresAt', newValue)
        break
      case 'expireintervalminutes':
        this.countdown.setAttribute('interval-minutes', newValue)
        break
    }
  }
}
