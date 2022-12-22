import * as td from 'testdouble'

import { EventDispatcher, EventListeners, uniqueishId } from './events.mjs'

describe('EventDispatcher', () => {
  it('notifies the EventListeners when dispatching an event', () => {
    let listeners = td.instance(EventListeners)

    let events = new EventDispatcher(uniqueishId, listeners)
    events.addListener(EventDispatcher.ALL_EVENTS, (_) => {})
    td.verify(listeners.add([EventDispatcher.ALL_EVENTS], td.matchers.isA(Function)))

    events.createIncident({})
    td.verify(listeners.notify(td.matchers.contains({ name: 'CreateIncident' })))
  })

  it('supports adding a listener to multiple events', () => {
    let listeners = td.instance(EventListeners)

    let events = new EventDispatcher(uniqueishId, listeners)
    events.addListener(['CreateIncident', 'UpdateIncident'], (_) => {})
    td.verify(listeners.add(['CreateIncident', 'UpdateIncident'], td.matchers.isA(Function)))

    events.createIncident({})
    td.verify(listeners.notify(td.matchers.contains({ name: 'CreateIncident' })))
    events.updateIncident(1, {})
    td.verify(listeners.notify(td.matchers.contains({ name: 'UpdateIncident' })))
  })

  it('delegates the removal of a listener', () => {
    let listeners = td.instance(EventListeners)
    let events = new EventDispatcher(uniqueishId, listeners)

    events.removeListener('CreateIncident', (e) => {})
    td.verify(listeners.remove(['CreateIncident'], td.matchers.isA(Function)))
  })

  it('delegates the removal of multiple listeners', () => {
    let listeners = td.instance(EventListeners)
    let events = new EventDispatcher(uniqueishId, listeners)

    events.removeListener(['CreateIncident', 'UpdateIncident'], (e) => {})
    td.verify(listeners.remove(['CreateIncident', 'UpdateIncident'], td.matchers.isA(Function)))
  })

})

describe('EventListeners', () => {
  specify('a listener to the EventListeners.ALL_EVENTS goes everywhere', () => {
    let ls = new EventListeners()
    let listener = td.func('listener')

    ls.add([EventListeners.ALL_EVENTS], listener)

    let createEvent = { name: 'CreateIncident' }
    ls.notify(createEvent)
    td.verify(listener(createEvent))

    let updateEvent = { name: 'UpdateIncident' }
    ls.notify(updateEvent)
    td.verify(listener(updateEvent))
  })

  specify('a listener for a single event only gets notified about that event', () => {
    let ls = new EventListeners()
    let listener = td.func('listener')

    ls.add(['UpdateIncident'], listener)
    ls.notify({ name: 'CreateIncident' })

    let updateEvent = { name: 'UpdateIncident' }
    ls.notify(updateEvent)
    td.verify(listener(updateEvent))
  })

  specify('a listener for multiple events only get notified about those', () => {
    let ls = new EventListeners()
    let listener = td.func('listener')

    ls.add(['CreateAction', 'UpdateIncident'], listener)
    ls.notify({ name: 'CreateIncident' })

    let updateEvent = { name: 'UpdateIncident' }
    ls.notify(updateEvent)
    td.verify(listener(updateEvent))

    let createAction = { name: 'CreateAction' }
    ls.notify(createAction)
    td.verify(listener(createAction))
  })

  describe('remove a listener', () => {
    specify('from a single event', () => {
      let ls = new EventListeners()
      let listener = td.func('listener')
      td.when(listener(td.matchers.anything()))
        .thenDo(() => { throw Error('listener called when it should be removed!')})
      ls.add(['CreateIncident'], listener)

      ls.remove(['CreateIncident'], listener)

      ls.notify({ name: 'CreateIncident' })
    })

    specify('from multiple events', () => {
      let ls = new EventListeners()
      let listener = td.func('listener')
      Array.of('CreateIncident', 'UpdateIncident').forEach(e => {
        td.when(listener(td.matchers.contains({ name: e })))
          .thenDo(() => { throw Error(`listener called for ${e} when it should be removed!`)})
      })
      ls.add(['CreateIncident', 'UpdateIncident', 'CreateAction'], listener)

      ls.remove(['CreateIncident', 'UpdateIncident'], listener)

      Array.of('CreateIncident', 'UpdateIncident', 'CreateAction').forEach(e => ls.notify({ name: e }))
      td.verify(listener(td.matchers.contains({ name: 'CreateAction' })))
    })

    specify('remove from all events when EventListeners.ALL_EVENTS is passed', () => {
      let ls = new EventListeners()
      let listener = td.func('listener')
      td.when(listener(td.matchers.anything()))
        .thenDo(() => { throw Error('listener called when it should be removed!')})
      ls.add(['CreateIncident', EventListeners.ALL_EVENTS], listener)

      ls.remove([EventListeners.ALL_EVENTS], listener)
      ls.notify({ name: 'CreateIncident' })
    })
  })
})
