// Duplicated objectFromForm from main.js...
function objectFromForm (form) {
  const data = {}
  for (const en of form) {
    data[en[0]] = en[1]
  }

  return data
}

export class AffectedSystems extends HTMLElement {
  /**
   * AffectedSystems handles the view and actions of current and cast affected components.
   * @param {EventDispatcher} eventDispatcher
   */
  constructor(eventDispatcher) {
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

        const input = this.querySelector('form input[name="affected_system"]')

        this.eventDispatcher.newAffectedSystem({name: input.value})

        e.target.reset()
        input.focus()
      })

    this.subscribedEvents = {
      NewAffectedSystem: this._new,
      UpdateAffectedSystem: this._update,
      ResolveAffectedSystem: this._resolve
    }
    for (const item of Object.entries(this.subscribedEvents)) {
      this.eventDispatcher.addListener(item[0], item[1].bind(this))
    }

    this.querySelector('dialog form').addEventListener('submit', e => {
      e.preventDefault()
      const updatedName = e.currentTarget.querySelector('input[name="affected_system"]').value
      const formData = new FormData(e.currentTarget)
      const id = formData.get('id')
      this.eventDispatcher.updateAffectedSystem(id, {name: updatedName})
      this._getDialog().close()
    })

    this.querySelector('dialog form').addEventListener('reset', e => {
      this._getDialog().close()
    })

  }

  _templatedHtml(id, affectedSystem) {
    return `
          <span>${affectedSystem.name}</span> <button data-test="affected-system__resolve">✅</button>
          
           <section class="actions">
           <section class="actions__add">
           <h1>New action</h1>
           <form>
           <ul>
           <li>
           <label for="newActionWhat">What are we trying?</label>
           <input type="text" id="newActionWhat" name="what" data-test="new-action__what">
           </li>
           
           <li>
           <label for="newActionWho">Who is doing it?</label>
           <input type="text" id="newActionWho" name="who" data-test="new-action__who" />
           </li>
           
           <li>
           <label for="newActionLink">Do you have a link for more information?</label>
           <input type="url" id="newActionLink" name="link"
           placeholder="https://company.slack.com/archive/…"
           data-test="new-action__link" />
           </li>
           
           <li>
           <label for="newActionWhen">Minutes between updates?</label>
           <input type="number" id="newActionWhen" name="expireIntervalMinutes" min="5"
           max="30" value="10" data-test="new-action__minutes-between-updates"/>
           </li>
           
           <li>
           <label>
           Is mitigating?
           <input type="checkbox" name="isAction" checked data-test="new-action__is-mitigating">
           </label>
           </li>
           </ul>
           
           <input type="hidden" name="affectedSystemId" value="${id}"/>
           <button type="submit" data-test="new-action__submit">Add</button>
           </form>
           </section>
           
           <section class="actions__active" data-affected_system_id="${id}" data-test="actions__active">
           <h1>Active actions</h1>
           <ul></ul>
           </section>
           
           <section class="actions__past" data-test="actions__past">
           <h1>Past actions</h1>
           <ul></ul>
           </section>
           </section>
      `
  }

  _new(e) {
    const li = document.createElement('li')
    li.setAttribute('data-id', e.id)
    li.innerHTML = this._templatedHtml(e.id, e.details)

    // Actions
    li.querySelector('.actions__add form').addEventListener('submit', e => {
      e.preventDefault()

      const data = objectFromForm(new FormData(e.currentTarget))
      data.type = data.isAction ? 'ACTION' : 'TASK'
      delete data.isAction
      this.eventDispatcher.createAction(data)

      e.currentTarget.reset()
    })

    li.querySelector('button')
      .addEventListener('click', (_) => this.eventDispatcher.resolveAffectedSystem(e.id, {type: 'SUCCESS'}))

    li.querySelector('span')
      .addEventListener('contextmenu', (e) => {
        e.preventDefault()
        const name = li.querySelector('span').innerHTML
        const dialog = this._getDialog()
        dialog.querySelector('form input[name="id"]').value = li.dataset.id
        dialog.querySelector('form input[name="affected_system"]').value = name
        dialog.showModal()
      })

    this.querySelector('.affected-systems__listing__active ul')
      .appendChild(li)
  }

  _update(e) {
    const li = this.querySelector(`.affected-systems__listing__active li[data-id="${e.affectedSystemId}"]`)

    // TODO: it feels wrong that _update has to know that the span happens to be where the name lives and this info also
    //       lives inside the templateHtml for a new LI also. We should come up with a consistent pattern.
    //       Probably just make the LI content its own webcomponent.
    li.querySelector('span').innerHTML = e.details.name
  }

  _resolve(e) {
    const li = this.querySelector(`.affected-systems__listing__active li[data-id="${e.affectedSystemId}"]`)
    li.remove()
    li.querySelector('button').remove()
    li.querySelector('section.actions__add').remove()

    this.querySelector('.affected-systems__listing__past ul').appendChild(li)
  }

  _getDialog() {
    return this.querySelector('dialog')
  }
}
