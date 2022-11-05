class CountdownTimer {
  cb
  timeout
  active
  _expiresAt

  constructor (cb) {
    this.cb = (tick) => {
      cb(tick)
      this.isFinished(tick) && this.stop()
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
    this.cb(this.countDown())

    this.stop()
    this.timeout = setInterval(() => this.cb(this.countDown()), 1000)
    this.active = true
  }

  isFinished (tick) {
    return tick.minutes === 0 && tick.seconds === 0
  }

  stop () {
    if (!this.timeout) return

    clearInterval(this.timeout)
    this.timeout = false
    this.active = false
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

    this.timer = new CountdownTimer(tick => {
      display.setAttribute('minutes', tick.minutes)
      display.setAttribute('seconds', tick.seconds)
    })
  }

  restart () {
    if (this.timer.active) {
      if (!window.confirm('The timer has not finished yet, are you sure?')) return
    }

    let minutesIntoFuture = parseInt(this.getAttribute('interval-minutes'), 10)
    let now = Date.now(),
      future = new Date(now + minutesIntoFuture * 60 * 1_000)
    this.setAttribute('to', future.toISOString())
  }

  static get observedAttributes () { return ['to'] }

  attributeChangedCallback (name, _, newValue) {
    this.timer.expiresAt = Date.parse(newValue) / 1000
  }

  connectedCallback () { this.timer.start() }

  disconnectedCallback () { this.timer.stop() }
}
