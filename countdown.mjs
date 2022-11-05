class CountdownTimer {
  perTickCb
  timeout
  active
  _expiresAt

  constructor (perTickCb, onStartStopCb) {
    this.perTickCb = (tick) => {
      perTickCb(tick)
      this.isFinished(tick) && this._stopNaturally()
    }
    this.isStartCb = (isStart) => {
      if (typeof onStartStopCb !== 'function') return
      onStartStopCb(isStart)
    }
    this.timeout = false
    this.active = false
  }

  get expiresAt () { return this._expiresAt }

  set expiresAt (v) {
    this._expiresAt = v

    this.start()
  }

  start () {
    this.perTickCb(this.countDown())

    this.stop()
    this.timeout = setInterval(() => this.perTickCb(this.countDown()), 1000)
    this.active = true
    this.isStartCb(true)
  }

  isFinished (tick) {
    return tick.minutes === 0 && tick.seconds === 0
  }

  stop () {
    if (!this.timeout) return false

    clearInterval(this.timeout)
    this.timeout = false
    this.active = false
    return true
  }

  /**
   * This uses the normal stop under the hood, but it's intended to only be used when we finish
   * the countdown as intended. We also stop the countdown when removed from the DOM, when changing
   * the interval, and when restarting the timer. This so that we only mark the countdown as
   * finished when it truly has.
   * @private
   */
  _stopNaturally () {
    if (this.stop()) this.isStartCb(false)
  }

  countDown () {
    let timeLeft = (this.expiresAt - (Date.now() / 1000)).toFixed()
    if (timeLeft < 0) timeLeft = 0

    let seconds = timeLeft % 60,
      minutes = (timeLeft - seconds) / 60

    return { minutes: minutes, seconds: seconds }
  }
}

export class CountdownDisplay extends HTMLElement {
  constructor () {
    super()

    let el = document.createElement('span')
    el.innerHTML = `-<span class="minutes">00</span>:<span class="seconds">00</span>`

    this.appendChild(el)
  }

  static get observedAttributes () { return ['minutes', 'seconds']}

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue === newValue) return

    this.querySelector(`span.${name}`).innerText = this.pad(newValue)
  }

  pad (s) {
    if (s.length === 1) return `0${s}`
    return s
  }
}

export class Countdown extends HTMLElement {
  timer

  constructor () {
    super()

    let display = new CountdownDisplay()
    this.appendChild(display)

    this.timer = new CountdownTimer(
      tick => {
        display.setAttribute('minutes', tick.minutes)
        display.setAttribute('seconds', tick.seconds)
      },
      (isStart) => {
        this.classList.toggle('finished', !isStart)

        if (!isStart) {
          if (Notification.permission === 'granted') {
            new Notification('Countdown finished!')
          }
        }
      }
    )
  }

  restart () {
    if (this.timer.active) {
      if (!window.confirm('The timer has not finished yet, are you sure?')) return
    }

    this._restartTimer()
  }

  _restartTimer () {
    let minutesIntoFuture = parseInt(this.getAttribute('interval-minutes'), 10)
    let now = Date.now(),
      future = new Date(now + minutesIntoFuture * 60 * 1_000)
    this.setAttribute('to', future.toISOString())
  }

  static get observedAttributes () { return ['to', 'interval-minutes'] }

  attributeChangedCallback (name, _, newValue) {
    switch (name) {
      case 'to':
        this.timer.expiresAt = Date.parse(newValue) / 1000
        break
      case 'interval-minutes':
        this._restartTimer()
        break
    }
  }

  connectedCallback () { this.timer.start() }

  disconnectedCallback () { this.timer.stop() }
}
