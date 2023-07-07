import { v4 as uuidv4 } from 'uuid';

// Incident
type AddIncidentResourceLink = { type: 'add_incident_resource_link', payload: ResourceLink }
type EditIncidentResourceLink = { type: 'edit_incident_resource_link', payload: ResourceLink }
type EditIncidentSummary = { type: 'edit_incident_summary', payload: IncidentSummary }

// Affected Systems
type AddAffectedSystem = { type: 'add_affected_system', payload: AffectedSystem }
type EditAffectedSystem = { type: 'edit_affected_system', payload: AffectedSystem }
type ResolveAffectedSystem = { type: 'resolve_affected_system', payload: string }

// Actions
type AddAction = { type: 'add_action', payload: Action }
type EditAction = { type: 'edit_action', payload: Action }
type ResolveActionSuccess = { type: 'resolve_action_success', payload: string }
type ResolveActionFailure = { type: 'resolve_action_failure', payload: string }
type UpdateActionTimer = { type: 'update_action_timer', payload: {minutes: number} }

// Putting it all together...
type IncidentEvents =
      EditIncidentSummary
    | AddIncidentResourceLink | EditIncidentResourceLink
    | AddAffectedSystem | EditAffectedSystem | ResolveAffectedSystem
    | AddAction | EditAction | ResolveActionSuccess | ResolveActionFailure
    | UpdateActionTimer


export type Incident = {
    summary: IncidentSummary
    affectedSystems: AffectedSystem[]
}

const getIndexesForActionId = (incident: Incident, id: string) => {
    let systemIndex = -1
    let actionIndex = -1
    incident.affectedSystems.forEach((system, sIndex) => {
        let i = system.actions.findIndex(a => a.id == id)
        if (i != -1) {
            systemIndex = sIndex
            actionIndex = i
        }
    })
    return { systemIndex, actionIndex }
}

const getIndexForSystemId = (incident: Incident, id: string) => {
    return incident.affectedSystems.findIndex(s => s.id == id)
}

const getIndexForResourceLinkId = (incident: Incident, id: string) => {
    return incident.summary.resourceLinks.findIndex(l => l.id == id)
}

const editIncidentSummary = (incident: Incident, summary: IncidentSummary) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    updatedIncident.summary = summary
    return updatedIncident
}

const addResourceLink = (incident: Incident, newResourceLink: ResourceLink): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    updatedIncident.summary.resourceLinks = [...updatedIncident.summary.resourceLinks, {id: `link_${uuidv4()}`, ...newResourceLink } ]
    return updatedIncident
}

const updateResourceLink = (incident: Incident, updatedResourceLink: ResourceLink): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const rlIndex = getIndexForResourceLinkId(incident, updatedResourceLink.id)
    if (rlIndex != -1) {
        updatedIncident.summary.resourceLinks[rlIndex] = updatedResourceLink
        return updatedIncident
    }

    throw new Error(`Could not find resource link with id ${updatedResourceLink.id} within incident: ${JSON.stringify(incident)}`)
}

const addAction = (incident: Incident, newAction: Action): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const systemIndex = getIndexForSystemId(incident, newAction.affectedSystemId as string)
    if (systemIndex != -1) {
        updatedIncident.affectedSystems[systemIndex].actions.push({id: uuidv4(), ...newAction})
        return updatedIncident
    }

    throw new Error(`Could not find system with id ${newAction.affectedSystemId} within incident: ${JSON.stringify(incident)}`)
}

const updateAction = (incident: Incident, updatedAction: Action): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, updatedAction.id as string)
    if (actionIndex != -1) {
        updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = updatedAction
        return updatedIncident
    }

    throw new Error(`Could not find action with id ${updatedAction.id} within incident: ${JSON.stringify(incident)}`)
}

const resolveActionFailure = (incident, actionId: string) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, actionId)
    if (actionIndex != -1) {
        const action = incident.affectedSystems[systemIndex].actions[actionIndex]
        updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = {...action, status: 'Failure'}
        return updatedIncident
    }

    throw new Error(`Could not find action with id ${actionId} within incident: ${JSON.stringify(incident)}`)
}

const resolveActionSuccess = (incident, actionId: string) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, actionId)
    if (actionIndex != -1) {
        const action = incident.affectedSystems[systemIndex].actions[actionIndex]
        updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = {...action, status: 'Success'}
        return updatedIncident
    }

    throw new Error(`Could not find action with id ${actionId} within incident: ${JSON.stringify(incident)}`)
}

const addAffectedSystem = (incident: Incident, newSystem: AffectedSystem): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    newSystem.id = `system_${uuidv4()}`
    newSystem.status = 'Active'
    newSystem.actions = newSystem.actions ?? []
    updatedIncident.affectedSystems.push(newSystem)
    return updatedIncident
}

const updateAffectedSystem = (incident: Incident, updatedSystem: AffectedSystem): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const sIndex = updatedIncident.affectedSystems.findIndex(s => s.id == updatedSystem.id)
    if (sIndex != -1) {
        updatedIncident.affectedSystems[sIndex] = updatedSystem
    }
    else {
        throw new Error(`Could not find system with id ${updatedSystem.id} within incident: ${JSON.stringify(incident)}`)
    }
    return updatedIncident
}

const resolveAffectedSystem = (incident: Incident, id: string) => {
    const sIndex = incident.affectedSystems.findIndex(s => s.id == id)
    return updateAffectedSystem(incident, {...incident.affectedSystems[sIndex], status: 'Resolved'})
}


export const incidentReducer = (incident: Incident, event: IncidentEvents): Incident => {
    const {type, payload} = event

    switch(type) {
        case 'edit_incident_summary':
            return editIncidentSummary(incident, payload as IncidentSummary)
        case 'add_incident_resource_link':
            return addResourceLink(incident, payload as ResourceLink)
        case 'edit_incident_resource_link':
            return updateResourceLink(incident, payload as ResourceLink)
        case 'add_affected_system':
            return addAffectedSystem(incident, payload as AffectedSystem)
        case 'edit_affected_system':
            return updateAffectedSystem(incident, payload as AffectedSystem)
        case 'resolve_affected_system':
            return resolveAffectedSystem(incident, payload as string)
        case 'add_action':
            return addAction(incident, payload as Action)
        case 'edit_action':
            return updateAction(incident, payload as Action)
        case 'resolve_action_success':
            return resolveActionSuccess(incident, payload as string)
        case 'resolve_action_failure':
            return resolveActionFailure(incident, payload as string)
        default: {
            throw Error(`Unknown event type: ${type} payload:${payload}`);
        }
    }
}
