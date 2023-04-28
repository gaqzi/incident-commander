export class IncidentSummary extends HTMLElement {
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

    for (const attr of IncidentSummary.observedAttributes) {
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

        const data = {}
        data[attr] = newVal
        this.eventDispatcher.updateIncident(this.id, data)
      })
    }

    this.eventDispatcher.addListener('UpdateIncident', e => {
      for (const kv of Object.entries(e.details)) {
        this.setAttribute(kv[0], kv[1])
      }
    })

    this.querySelector('dialog form').addEventListener('submit', e => {
      e.preventDefault()
      const data = objectFromForm(new FormData(e.currentTarget))
      if (data.id === '') {
        delete data.id
        this.eventDispatcher.addResourceLink(data)
      } else {
        const id = data.id
        delete data.id
        this.eventDispatcher.updateResourceLink(id, data)
      }

      e.currentTarget.reset()
      e.currentTarget.querySelector('input[name="id"]').value = ''
      this.querySelector('dialog').close()
    })

    this.querySelector('.add-link').addEventListener('click', e => {
      e.preventDefault()
      const dialog = document.querySelector('dialog')
      dialog.showModal()
    })
    this.querySelector('dialog button[type="reset"]')
      .addEventListener('click', e => {
        this.querySelector('dialog input[name="id"]').value = ''
        this.querySelector('dialog').close(null)
      })

    for (const eventName of ['AddResourceLink', 'UpdateResourceLink']) {
      this.eventDispatcher.addListener(eventName, this._handleLinkEvents.bind(this))
    }
  }

  _handleLinkEvents (e) {
    let el = null
    switch (e.name) {
      case 'AddResourceLink':
        this._addResourceLink(e)
        break
      case 'UpdateResourceLink':
        el = this.querySelector(`.incident-summary__links__list a[data-id="${e.resourceLinkId}"]`)
        if (el === null) throw new Error(`Unable to find link to update: ${e.id}, ${JSON.stringify(e.details)}`)

        el.setAttribute('href', e.details.url)
        el.innerHTML = e.details.description
        break
      default:
        throw new Error(`Unable to handle link event: ${e.name}`)
    }
  }

  _addResourceLink (e) {
    const list = this.querySelector('.incident-summary__links__list')
    const el = document.createElement('li')
    el.innerHTML = `<a href="${e.details.url}" target="_blank" class="external" data-id="${e.id}">${e.details.description}</a>`
    el.addEventListener('contextmenu', this._showUpdateLinkDialog.bind(this))
    list.appendChild(el)
  }

  _showUpdateLinkDialog (e) {
    e.preventDefault()

    const dialog = this.querySelector('dialog')
    dialog.querySelector('input[name="description"]').value = e.target.innerHTML
    dialog.querySelector('input[name="url"]').value = e.target.getAttribute('href')
    dialog.querySelector('input[name="id"]').value = e.target.dataset.id
    dialog.showModal()
  }

  static get observedAttributes () {
    return ['what', 'when', 'where', 'impact', 'status']
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue === newValue) return

    this.querySelector(`.message .${name}`).innerText = newValue
  }
}
