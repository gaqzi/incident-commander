export class AffectedSystems extends HTMLElement {
  /**
   * AffectedSystems handles the view and actions of current and cast affected components.
   * @param {EventDispatcher} eventDispatcher
   */
  constructor (eventDispatcher) {
    super()
    this.eventDispatcher = eventDispatcher

    this.innerHTML = `
    <section class="affected-systems__new">
      <h1>Affected component/system</h1>
  
      <form>
          <ul>
            <li>
              <label>What is not working?</label>
              <input type="text" name="affected_system" placeholder="Payment redirections">
            </li>
          </ul>
          <button type="submit">Add!</button>
      </form>
    </section>
    
    <section class="affected-systems__listing">
      <section class="affected-systems__listing__active">
          <h1>Ongoing</h1>
          <ul></ul>
      </section>
      
      <section class="affected-systems__listing__past">
          <h1>Resolved</h1>
          <ul></ul>
      </section>
    </section>
    `

    this.querySelector('form')
      .addEventListener('submit', (e) => {
        e.preventDefault()

        let input = this.querySelector('form input[name="affected_system"]')

        this.eventDispatcher.newAffectedSystem({ name: input.value })

        e.target.reset()
        input.focus()
      })

    this.subscribedEvents = {
      'NewAffectedSystem': this._new,
      'ResolveAffectedSystem': this._resolve,
    }
    for (let item of Object.entries(this.subscribedEvents)) {
      this.eventDispatcher.addListener(item[0], item[1].bind(this))
    }
  }

  _new (e) {
    let li = document.createElement('li')
    li.setAttribute('data-id', e.id)
    li.innerHTML = `${e.details.name} <button>✅</button>`

    li.querySelector('button')
      .addEventListener('click', (_) => this.eventDispatcher.resolveAffectedSystem(e.id, { type: 'SUCCESS' }))

    this.querySelector('.affected-systems__listing__active ul')
      .appendChild(li)
  }

  _resolve (e) {
    let li = this.querySelector(`.affected-systems__listing__active li[data-id="${e.affectedSystemId}"]`)
    li.remove()
    li.querySelector('button').remove()

    this.querySelector('.affected-systems__listing__past ul').appendChild(li)
  }
}
