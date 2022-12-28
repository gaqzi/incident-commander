/**
 * @callback idCreator
 * @param {string} prefix
 * @return {string} A unique ID
 */

// It's not perfect, ideally it'd just be a UUID but until this thing becomes more production it'll do for a single user's need.
export function uniqueishId (prefix) {
  prefix = prefix ? `${prefix}:` : ''
  return prefix + (Date.now() + Math.random()).toString(36)
}

/**
 * Any function that takes a single argument can be passed as an event listener.
 * @callback eventListener
 * @param {Object} event
 */

export class EventListeners {
  static ALL_EVENTS = '__ALL_EVENTS__'

  constructor () {
    this._listeners = {}
  }

  /**
   * Add a listener for the passed list of events.
   * @param {Array<string>} events
   * @param {eventListener} listener
   */
  add(events, listener) {
    events.forEach(e => {
      this._listeners[e] = this._listeners[e] || []
      this._listeners[e].push(listener)
    })
  }

  /**
   * Removes the listener from the named events.
   * If the special EventListeners.ALL_EVENTS is used then it will be removed from everything
   * and not just the single all events dispatch.
   * @param {Array<string>} events
   * @param {eventListener} listener
   */
  remove(events, listener) {
    let removeListener = (l) => l !== listener

    for(let event of events) {
      if(event === EventListeners.ALL_EVENTS) {
        for(let kv of Object.entries(this._listeners)) {
          this._listeners[kv[0]] = kv[1].filter(removeListener)
        }

        return // no need to continue since we're already cleared all others
      }

      this._listeners[event] = this._listeners[event].filter(removeListener)
    }
  }

  notify(event) {
    for(let cb of this._listeners[EventListeners.ALL_EVENTS] || []) cb(event)
    for(let cb of this._listeners[event.name] || []) cb(event)
  }
}

export class EventDispatcher {
  static ALL_EVENTS = EventListeners.ALL_EVENTS

  /**
   *
   * @param {EventListeners} [listeners]
   * @param {idCreator} [idCreator=uniqueishId]
   */
  constructor (listeners, idCreator) {
    this.listeners = listeners || new EventListeners()
    this.idCreator = idCreator || uniqueishId
    this.allEvents = []
  }

  /**
   *
   * @param {string|Array<string>} events
   * @param {eventListener} listener
   */
  addListener (events, listener) {
    if(typeof events === 'string') events = [events]
    this.listeners.add(events, listener)
  }

  /**
   *
   * @param {string|Array<string>} events
   * @param {eventListener} listener
   */
  removeListener(events, listener) {
    if(typeof events === 'string') events = [events]
    this.listeners.remove(events, listener)
  }

  _dispatch (name, detail) {
    detail.name = name
    detail.recordedAt = detail.recordedAt || new Date()

    this.allEvents.push(detail)
    this.listeners.notify(detail)

    return detail
  }

  createIncident (data) {
    return this._dispatch('CreateIncident', { id: this.idCreator('i'), details: data })
  }

  updateIncident (id, data) {
    return this._dispatch('UpdateIncident', { id: this.idCreator('iu'), incidentId: id, details: data })
  }

  addResourceLink (data) {
    return this._dispatch('AddResourceLink', { id: this.idCreator('l'), details: data })
  }

  updateResourceLink (id, data) {
    return this._dispatch('UpdateResourceLink', { id: this.idCreator('lu'), resourceLinkId: id, details: data })
  }

  createAction (data) {
    return this._dispatch('CreateAction', { id: this.idCreator('a'), details: data })
  }

  updateAction (id, data) {
    return this._dispatch('UpdateAction', { id: this.idCreator('au'), actionId: id, details: data })
  }

  finishAction (id, data) {
    return this._dispatch('FinishAction', { id: this.idCreator('af'), actionId: id, details: data })
  }

  newAffectedSystem (data) {
    return this._dispatch('NewAffectedSystem', { id: this.idCreator('s'), details: data })
  }

  resolveAffectedSystem (id, data) {
    return this._dispatch('ResolveAffectedSystem', { id: this.idCreator('sr'), affectedSystemId: id, details: data })
  }
}
