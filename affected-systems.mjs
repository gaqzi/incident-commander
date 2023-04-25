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
              <input type="text" name="affected_system" placeholder="Payment redirections" data-test="new-affected-system__what">
            </li>
          </ul>
          <button type="submit" data-test="new-affected-system__submit">Add!</button>
      </form>
    </section>
    
    <section class="affected-systems__listing" data-test="affected-systems">
      <section class="affected-systems__listing__active" data-test="affected-systems__active">
          <h1>Ongoing</h1>
          <ul></ul>
      </section>
      
      <section class="affected-systems__listing__past" data-test="affected-systems__past">
          <h1>Resolved</h1>
          <ul></ul>
      </section>
      
      <dialog data-test="update-affected-system__dialog">
            <h1>Update Affected System</h1>
            <form>
                <input type="text" name="affected_system" value="" data-test="update-affected-system__what">
                <input type="hidden" name="id" value="">
                <button type="submit" data-test="update-affected-system__submit">Update</button>
                <button type="reset" class="cancel" data-test="update-affected-system__cancel">Cancel</button>
            </form>
      </dialog>
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
      'UpdateAffectedSystem': this._update,
      'ResolveAffectedSystem': this._resolve,
    }
    for (let item of Object.entries(this.subscribedEvents)) {
      this.eventDispatcher.addListener(item[0], item[1].bind(this))
    }

      this.querySelector('dialog form').addEventListener('submit', e => {
          e.preventDefault()
          const updatedName = e.currentTarget.querySelector('input[name="affected_system"]').value
          const formData = new FormData(e.currentTarget)
          const id = formData.get('id')
          this.eventDispatcher.updateAffectedSystem(id, { name: updatedName })
          this._getDialog().close()
      })

      this.querySelector('dialog form').addEventListener('reset', e => {
          this._getDialog().close()
      })
  }

  _templatedHtml (affected_system) {
      const name = affected_system.name
      return `
          <span>${affected_system.name}</span> <button data-test="affected-system__resolve">✅</button>
      `
  }

  _new (e) {
    let li = document.createElement('li')
    li.setAttribute('data-id', e.id)
      li.innerHTML = this._templatedHtml(e.details)

    li.querySelector('button')
      .addEventListener('click', (_) => this.eventDispatcher.resolveAffectedSystem(e.id, { type: 'SUCCESS' }))

    li.querySelector('span')
        .addEventListener('contextmenu', (e) =>  {
          e.preventDefault()
          let name = li.querySelector('span').innerHTML
          let dialog = this._getDialog()
          dialog.querySelector('form input[name="id"]').value = li.dataset.id
          dialog.querySelector('form input[name="affected_system"]').value = name
          dialog.showModal()
        })

    this.querySelector('.affected-systems__listing__active ul')
      .appendChild(li)
  }

    _update (e) {
        let li = this.querySelector(`.affected-systems__listing__active li[data-id="${e.affectedSystemId}"]`)

        // TODO: it feels wrong that _update has to know that the span happens to be where the name lives and this info also
        //       lives inside the templateHtml for a new LI also. We should come up with a consistent pattern.
        //       Probably just make the LI content its own webcomponent.
        li.querySelector('span').innerHTML = e.details.name
    }

  _resolve (e) {
    let li = this.querySelector(`.affected-systems__listing__active li[data-id="${e.affectedSystemId}"]`)
    li.remove()
    li.querySelector('button').remove()

    this.querySelector('.affected-systems__listing__past ul').appendChild(li)
  }

  _getDialog() {
      return this.querySelector('dialog')
  }
}
