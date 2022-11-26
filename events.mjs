/**
 * @typedef idCreator
 * @type {function}
 * @param {string} prefix
 * @return {string} A unique ID
 */

// It's not perfect, ideally it'd just be a UUID but until this thing becomes more production it'll do for a single user's need.
export function uniqueishId (prefix) {
  prefix = prefix ? `${prefix}:` : ''
  return prefix + (Date.now() + Math.random()).toString(36)
}

export class EventDispatcher {
  /**
   *
   * @param {HTMLElement} eventTarget
   * @param {idCreator} idCreator
   */
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

  updateAction (id, data) {
    return this._dispatch('UpdateAction', { id, details: data })
  }

  finishAction (id, data) {
    return this._dispatch('FinishAction', { id: id, details: data })
  }

  newAffectedSystem (data) {
    return this._dispatch('NewAffectedSystem', { id: this.idCreator('s'), details: data })
  }

  resolveAffectedSystem (id, data) {
    return this._dispatch('ResolveAffectedSystem', { id: id, details: data })
  }
}
