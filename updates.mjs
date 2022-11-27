class Reporter {
  constructor (e) {
    this.id = e.id
    this.recordedAt = e.recordedAt
    this.lastUpdatedAt = e.lastUpdatedAt
    this.details = e.details
  }

  process (e) {
    if (e.recordedAt > this.lastUpdatedAt) this.lastUpdatedAt = e.recordedAt

    for (let kv of Object.entries(e.details)) {
      this.details[kv[0]] = kv[1]
    }
  }

  slack () { throw `unimplemented markdown reporter for ${this.type}` }
}

class IncidentReporter extends Reporter {
  type = 'Incident'

  slack () {
    return `*${this.details.status}* Since ${this.details.when} we are seeing ${this.details.what} in ${this.details.where} impacting ${this.details.impact}.`
  }
}

class AffectedSystemReporter extends Reporter {
  type = 'AffectedSystem'

  slack () {
    let status = this.details.type === 'SUCCESS' ? '✅' : '🔴'
    return `${status} ${this.details.name}`
  }
}

class ActionReporter extends Reporter {
  type = 'Action'

  slack () {
    let resolution = ''
    if (this.details.resolution === 'SUCCESSFUL') {
      resolution = this.details.type === 'ACTION' ? '✅' : '✔️'
    } else if (this.details.resolution === 'FAILED') {
      resolution = '❌'
    }

    let link = ''
    if (this.details.link) link = `[More info](${this.details.link})`

    return `${resolution} ${this.details.what} (${this.details.who}) ${link}`
  }
}

function reporterFactory (e) {
  switch (e.name) {
    case 'CreateIncident':
    case 'UpdateIncident':
    case 'ResolveIncident':
      return new IncidentReporter(e)
    case 'NewAffectedSystem':
    case'UpdateAffectedSystem':
    case 'ResolveAffectedSystem':
      return new AffectedSystemReporter(e)
    case 'CreateAction':
    case 'UpdateAction':
    case 'FinishAction':
      return new ActionReporter(e)
  }
  throw `Unknown event looking for reporter: ${e.name}`
}

/**
 * Combines events into a single reporter per event category
 * @param events
 * @return Object<string,Reporter> where the string is the type of reporter
 */
function flattenEvents (events) {
  let finalEvents = {} /** @type Object<string,Reporter> */
  for (let e of events) {
    if (finalEvents[e.id] === undefined) {
      finalEvents[e.id] = reporterFactory(e)
      continue
    }

    finalEvents[e.id].process(e)
  }

  return Object.values(finalEvents)
    .sort((a, b) => a.recordedAt - b.recordedAt)
    .reduce((all, e) => {
      if (all[e.type] === undefined) all[e.type] = []
      all[e.type].push(e)
      return all
    }, {})
}

function affectedSystemOutput (events) {
  let output = []

  let stillAffectedSystems = events
    .filter(r => r.details.type !== 'RESOLVED')
    .map(r => r.slack())
  if (stillAffectedSystems.length > 0) {
    output.push('- ' + stillAffectedSystems.join('\n- '))
  }

  let resolvedAffectedSystems = events
    .filter(r => r.details.type === 'RESOLVED')
    .map(r => r.slack())
  if (resolvedAffectedSystems.length > 0) {
    output.push('- ' + resolvedAffectedSystems.join('\n- '))
  }

  return output
}

class BusinessUpdate {
  EVENTS = [
    'CreateIncident', 'UpdateIncident', 'ResolveIncident',
    'NewAffectedSystem', 'UpdateAffectedSystem', 'ResolveAffectedSystem',
  ]

  report (events) {
    let finalEvents = flattenEvents(events.filter(e => this.EVENTS.includes(e.name)))

    let output = [
      finalEvents['Incident'][0].slack(),
      '\n',
      '*Current status:*',
    ].concat(affectedSystemOutput(finalEvents['AffectedSystem']))

    return output.join('\n')
  }
}

class TechUpdate {
  report (events) {
    let finalEvents = flattenEvents(events)

    let output = [
      finalEvents['Incident'][0].slack(),
      '\n*Current status:*'
    ].concat(affectedSystemOutput(finalEvents['AffectedSystem']))

    let openActions = finalEvents['Action']
      .filter(r => !r.details.resolution)
      .map(r => r.slack())
    if (openActions.length > 0) {
      output.push('\n*Actions:*')
      output.push('- ' + openActions.join('\n- '))
    }

    let finishedActions = finalEvents['Action']
      .filter(r => !!r.details.resolution)
      .map(r => r.slack())
    if (finishedActions.length > 0) {
      output.push('\n*Past actions:*')
      output.push('- ' + finishedActions.join('\n- '))
    }

    return output.join('\n')
  }
}

export class UpdatesSection extends HTMLElement {
  /**
   *
   * @param {EventDispatcher} eventDispatcher
   */
  constructor (eventDispatcher) {
    super()

    this.eventDispatcher = eventDispatcher
    this.innerHTML = `
        <button data-type="business-update">📋 Business update</button>
        <button data-type="tech-update">📋 Tech update</button>
    `

    this.querySelectorAll('button')
      .forEach(el => el.addEventListener('click', this._clickHandler.bind(this)))
  }

  async _clickHandler (e) {
    let update = null
    switch (e.target.dataset.type) {
      case 'business-update':
        update = new BusinessUpdate()
        break
      case 'tech-update':
        update = new TechUpdate()
        break
      default:
        return
    }
    if (update === null) throw 'Failed to find update class from update button click'

    let report = update.report(this.eventDispatcher.allEvents)
    console.log(report)
    await navigator.clipboard.writeText(report)

    // XXX: make nicer, like so many other things, but it works :p
    let oldVal = e.target.innerText
    let copiedMsg = 'Copied!'
    if (copiedMsg.length < oldVal.length) copiedMsg += ' '.repeat(oldVal.length - copiedMsg.length)
    e.target.innerText = copiedMsg
    setTimeout(() => e.target.innerText = oldVal, 500)
  }
}
