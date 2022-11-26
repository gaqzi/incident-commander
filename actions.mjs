export class ActiveActions extends HTMLElement {
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
}
