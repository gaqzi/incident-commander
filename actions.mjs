export class ActiveActions extends HTMLElement {
  constructor () {
    super()
    this.id = this.getAttribute('id')
    const template = document.getElementById('actions__active__item').content

    let expiresAt = this.getAttribute('expiresAt')
    const interval = parseInt(this.getAttribute('expireIntervalMinutes'), 10)
    if (expiresAt === null) {
      const createdAt = Date.parse(this.getAttribute('createdAt'))

      expiresAt = new Date(createdAt + (interval * 60_000)).toISOString()
      this.setAttribute('expiresAt', expiresAt)
    }

    this.appendChild(template.cloneNode(true))

    this.countdown = this.querySelector('countdown-timer')

    for (const el of ['link', 'who', 'what']) {
      this.querySelector('.description').querySelector(`.${el}`).addEventListener('contextmenu', e => {
        e.preventDefault()
        const value = prompt('What do you want to change to?', this.getAttribute(el))

        const data = {}
        data[el] = value
        this.eventDispatcher.updateAction(this.id, data)
      })
    }

    this.querySelector('input[name="is_action"]').addEventListener('change', e => {
      this.eventDispatcher.updateAction(this.id, { type: e.target.checked ? 'ACTION' : 'TASK' })
    })

    this.querySelectorAll('button.finish').forEach(el => el.addEventListener('click', e => {
      // Feels like there's a need for a third button, one for incident mitigated/resolved
      const finishStatus = e.target.classList.contains('success') ? 'SUCCESSFUL' : 'FAILED'
      const type = this.querySelector('input[name="is_action"]').checked ? 'ACTION' : 'TASK'

      let reason
      if (finishStatus === 'FAILED') {
        reason = prompt('Why did this action fail?')
        if (reason === null) return
      }

      this.eventDispatcher.finishAction(this.id, {
        type,
        resolution: finishStatus,
        reason
      })
    })
    )

    this.querySelector('button[name="pushTimer"]').addEventListener('click', e => {
      // let countdown = this.querySelector('countdown-timer')
      this.countdown.restart()
      this.eventDispatcher.updateAction(this.id, { expiresAt: this.countdown.getAttribute('to') })
    })
    this.querySelector('button[name="pushTimer"]').addEventListener('contextmenu', e => {
      e.preventDefault()

      const interval = prompt('How many minutes do you want to count down to instead?', '20')
      if (interval === null) return

      const newInterval = Number.parseInt(interval, 10)
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
        expiresAt: this.countdown.getAttribute('to')
      })
    })
  }

  /** @param {EventDispatcher} v */
  set eventDispatcher (v) {
    if (this._eventDispatcher !== undefined) return

    this._eventDispatcher = v

    const that = this
    this._updateEventDispatcher = e => {
      if (e.actionId !== that.id) return

      for (const item of Object.entries(e.details)) {
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
      'expiresat', 'expireintervalminutes'
    ]
  }

  attributeChangedCallback (name, _, newValue) {
    switch (name) {
      case 'type':
        this.querySelector('input[name="is_action"]').checked = newValue === 'ACTION'
        break

      case 'link':
        this._setLink(newValue)
        break

      case 'what':
      case 'who':
        this.querySelector(`.description .${name}`).innerText = newValue
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

  _setLink (url) {
    const link = this.querySelector('.description .link')
    if (url === '') {
      link.innerText = 'Link missing'
      return
    }

    link.innerHTML = `<a href="${url}" class="external" target="_blank">More information</a>`
  }
}
