import { EventDispatcher } from './events.mjs'

export class Storage {
  /**
   * add stores an event for a particular incident to the store.
   * @param {string} incidentId
   * @param {Object} event
   * @returns Promise<undefined>
   */
  add (incidentId, event) {
    throw new Error('add not implemented on storage')
  }

  /**
   * allEvents fetches all stored events for incidentId in ascending order.
   * @param {string} incidentId
   * @returns Promise<Array<Object>>
   */
  allEvents (incidentId) {
    throw new Error('allEvents not implemented on storage')
  }

  /**
   * allIncidents fetches the snapshot view of all incidents as an event.
   * @returns Promise<Array<Object>>
   */
  allIncidents () {
    throw new Error('allIncidents not implemented on storage')
  }
}

export class IndexedDB extends Storage {
  /**
   *
   * @param {IDBDatabase} db
   */
  constructor (db) {
    super()
    this._idb = db
  }

  add (incidentId, event) {
    return new Promise((resolve, reject) => {
      let transaction = this._idb.transaction('incidents', 'readwrite')
      transaction.onerror = (e) => {
        reject(`failed to create transaction for incidents store: ${e.target.error}}`)
      }
      transaction.oncomplete = (e) => resolve(undefined)

      event.incidentId = incidentId
      let request = transaction.objectStore('incidents').add(event)
      request.onerror = (e) => {
        e.preventDefault()
        reject(`failed to add event "${JSON.stringify(event)}": objectStore "${e.target.source.name}": ${e.target.error}`)
      }
    })
  }

  allEvents (incidentId) {
    return new Promise((resolve, reject) => {
      let transaction = this._idb.transaction('incidents', 'readonly')
      transaction.onerror = (e) => reject(`failed to create transaction for incidents store: ${JSON.stringify(e)}`)

      let events = []
      transaction.oncomplete = (e) => resolve(events)

      let index = transaction
        .objectStore('incidents')
        .index('byIncidentId')
      index.getAll(incidentId).onsuccess = (e) => events = e.target.result.sort((a, b) => a.recordedAt - b.recordedAt)
    })
  }

  allIncidents () {
    return new Promise((resolve, reject) => {
      let transaction = this._idb.transaction('incidents', 'readonly')
      transaction.onerror = (e) => reject(`failed to create transaction for incidents store: ${JSON.stringify(e)}`)

      let incidents = []
      transaction.oncomplete = (e) => resolve(incidents)

      transaction
        .objectStore('incidents')
        .getAll().onsuccess = (e) => incidents = e.target.result.filter(i => i.name === 'CreateIncident').sort((a, b) => a.recordedAt - b.recordedAt)
    })
  }
}

/**
 *
 * @param {IDBFactory} idb
 */
export function NewIndexedDB (idb) {
  return new Promise((resolve, reject) => {
    let req = idb.open('incident-commander', 1)
    req.onupgradeneeded = (e) => {
      let db = e.target.result
      console.log('time to upgrade the DB!')
      console.log(e)
      switch (e.newVersion) {
        case 1:
          let store = db.createObjectStore('incidents', { keyPath: 'id' })
          store.onerror = e => {reject(`failed to create object store: ${JSON.stringify(e)}`)}
          store.createIndex('byIncidentId', 'incidentId', { unique: false })
          break
        default:
          reject(`Do not know how to upgrade to IndexedDB version ${e.newVersion}, aborting!`)
      }
    }
    req.onerror = (e) => {
      reject(`unable to get access to IndexedDB: ${JSON.stringify(e)}`)
    }

    req.onsuccess = (e) => resolve(new IndexedDB(e.target.result))
  })
}
