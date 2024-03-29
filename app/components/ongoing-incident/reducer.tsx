import config from '../../config'
import AffectedSystem from '../affected-system/affected-system'

// Incident
type AddIncidentResourceLink = { type: 'add_incident_resource_link', payload: ResourceLink }
type EditIncidentResourceLink = { type: 'edit_incident_resource_link', payload: ResourceLink }
type EditIncidentSummary = { type: 'edit_incident_summary', payload: IncidentSummary }

// Affected Systems
type AddAffectedSystem = { type: 'add_affected_system', payload: AffectedSystem }
type EditAffectedSystem = { type: 'edit_affected_system', payload: AffectedSystem }

type ResolveAffectedSystem = { type: 'resolve_affected_system', payload: string }
type UnresolveAffectedSystem = { type: 'unresolve_affected_system', payload: string }

// Actions
type AddAction = { type: 'add_action', payload: Action }
type EditAction = { type: 'edit_action', payload: Action }

type ResolveActionPayload = { actionId: string, resolution: string }
type ResolveActionChore = { type: 'resolve_action_chore', payload: string }
type ResolveActionSuccess = { type: 'resolve_action_success', payload: string }
type ResolveActionFailure = { type: 'resolve_action_failure', payload: ResolveActionPayload }
type UnresolveAction = { type: 'unresolve_action', payload: string }

type AddActionTimelineItem = { type: 'add_action_timeline_item', payload: TimelineItem }
type EditActionTimelineItem = { type: 'edit_action_timeline_item', payload: TimelineItem }
type RemoveActionTimelineItem = { type: 'remove_action_timeline_item', payload: string }

// Putting it all together...
type IncidentEvents =
      EditIncidentSummary
    | AddIncidentResourceLink | EditIncidentResourceLink
    | AddAffectedSystem | EditAffectedSystem | ResolveAffectedSystem | UnresolveAffectedSystem
    | AddAction | EditAction 
    | ResolveActionChore | ResolveActionSuccess | ResolveActionFailure | UnresolveAction 
    | AddActionTimelineItem | EditActionTimelineItem | RemoveActionTimelineItem


const getIndexesForActionTimelineEntryId = (incident: Incident, id: string) => {
    let systemIndex = -1
    let actionIndex = -1
    let timelineEntryIndex = -1

    incident.affectedSystems.forEach((system, sIndex) => {
        if (!system.actions) {
            return
        }

        system.actions.forEach((action, aIndex) => {
            if (!action.timeline) {
                return
            }

            let i = action.timeline.findIndex(t => t.id == id)
            if (i != -1) {
                systemIndex = sIndex
                actionIndex = aIndex
                timelineEntryIndex = i
            }
        })
    })

    return { systemIndex, actionIndex, timelineEntryIndex }
}

const getIndexesForActionId = (incident: Incident, id: string) => {
    let systemIndex = -1
    let actionIndex = -1
    incident.affectedSystems.forEach((system, sIndex) => {
        if (!system.actions) {
            return
        }
        else {
            let i = system.actions.findIndex(a => a.id == id)
            if (i != -1) {
                systemIndex = sIndex
                actionIndex = i
            }
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

const editIncidentSummary = (incident: Incident, updatedSummary: IncidentSummary) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    updatedIncident.summary = {...updatedIncident.summary, ...updatedSummary, _isNew: false}

    if (incident.summary._isNew) {
        // This is the initial user form submission to create the incident,
        // so also create the first affected system from the what.
        updatedIncident = addAffectedSystem(updatedIncident, {id: 'system_0', what: updatedSummary.what})


        // HACK: we are throwing `addDefaultActions` into the payload for the update incident summary event
        // for the special case of when the initial incident summary data is submitted. It's not part of the
        // IncidentSummary type. We should probably figure out a cleaner way to do this but it's fine for now.
        if (updatedSummary.addDefaultActions) {
            // This is a special case where we are making a new incident record,
            // and we just created the first Affected System above. So we can safely
            // grab it from the incident's array of affected systems (there will be only one)
            // and use its ID value to associate the default actions with it.
            const affectedSystemId = updatedIncident.affectedSystems[0].id

            config.defaultActions.forEach((what, index) => {
                updatedIncident = addAction(updatedIncident, {
                    id: `action_default_${index}`,
                    status: 'Active',
                    what,
                    affectedSystemId,
                    timer: { durationInMinutes: 0, isRunning: false, startedAtUtc: '' }
                })
            })
        }

    }

    return updatedIncident
}

const addResourceLink = (incident: Incident, newResourceLink: ResourceLink): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    updatedIncident.summary.resourceLinks = [...updatedIncident.summary.resourceLinks, newResourceLink ]
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
    const status = 'Active'

    const systemIndex = getIndexForSystemId(incident, newAction.affectedSystemId as string)
    if (systemIndex != -1) {
        updatedIncident.affectedSystems[systemIndex].actions.push({...newAction, status})
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

const resolveActionFailure = (incident: Incident, payload: ResolveActionPayload) => {
    const { actionId, resolution } = payload
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, actionId)
    if (actionIndex != -1) {
        const affectedSystem = incident.affectedSystems[systemIndex]
        if (affectedSystem && affectedSystem.actions) {
            const action = affectedSystem.actions[actionIndex]
            const timer = action.timer
            updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = {...action, status: 'Failure', resolution, timer: {...timer, isRunning: false, durationInMinutes: 0 }}
        }
        return updatedIncident
    }

    throw new Error(`Could not find action with id ${actionId} within incident: ${JSON.stringify(incident)}`)
}

const resolveActionChore = (incident: Incident, actionId: string) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, actionId)
    if (actionIndex != -1) {
        const affectedSystem = incident.affectedSystems[systemIndex]
        if (affectedSystem && affectedSystem.actions) {
            const action = affectedSystem.actions[actionIndex]
            const timer = action.timer
            updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = {...action, status: 'Chore', timer: {...timer, isRunning: false, durationInMinutes: 0 }}
        }
        return updatedIncident
    }

    throw new Error(`Could not find action with id ${actionId} within incident: ${JSON.stringify(incident)}`)
}

const resolveActionSuccess = (incident: Incident, actionId: string) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, actionId)
    if (actionIndex != -1) {
        const affectedSystem = incident.affectedSystems[systemIndex]
        if (affectedSystem && affectedSystem.actions) {
            const action = affectedSystem.actions[actionIndex]
            const timer = action.timer
            updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = {...action, status: 'Success', timer: {...timer, isRunning: false, durationInMinutes: 0 }}
        }
        return updatedIncident
    }

    throw new Error(`Could not find action with id ${actionId} within incident: ${JSON.stringify(incident)}`)
}

const unresolveAction = (incident: Incident, actionId: string) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, actionId)
    if (actionIndex != -1) {
        const affectedSystem = incident.affectedSystems[systemIndex]
        if (affectedSystem && affectedSystem.actions) {
            const action = affectedSystem.actions[actionIndex]
            const timer = action.timer
            updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = {...action, status: 'Active', timer: {...timer, isRunning: false, durationInMinutes: 0 }}
        }
        return updatedIncident
    }

    throw new Error(`Could not find action with id ${actionId} within incident: ${JSON.stringify(incident)}`)
}

const addAffectedSystem = (incident: Incident, newSystem: AffectedSystem): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const status = 'Active'
    let actions = newSystem.actions ?? []

    if (newSystem.addDefaultActions) {
        const affectedSystemId = newSystem.id

        actions = actions.concat(config.defaultActions.map((what, index) => {
            return {
                id: `${affectedSystemId}_action_default_${index}`,
                status: 'Active',
                what,
                affectedSystemId
            }
        }))
    }

    updatedIncident.affectedSystems.push({...newSystem, status, actions})
    return updatedIncident
}

const updateAffectedSystem = (incident: Incident, updatedSystem: AffectedSystem): Incident => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const sIndex = updatedIncident.affectedSystems.findIndex((s: AffectedSystem) => s.id == updatedSystem.id)
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

const unresolveAffectedSystem = (incident: Incident, id: string) => {
    const sIndex = incident.affectedSystems.findIndex(s => s.id == id)
    return updateAffectedSystem(incident, {...incident.affectedSystems[sIndex], status: 'Active'})
}

const addTimelineEntryToAction = (incident: Incident, timelineItem: TimelineItem) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex } = getIndexesForActionId(incident, timelineItem.parentId)
    if (actionIndex != -1) {
        const affectedSystem = incident.affectedSystems[systemIndex]
        if (affectedSystem && affectedSystem.actions) {
            const action = affectedSystem.actions[actionIndex]
            const timeline = action.timeline || []
            updatedIncident.affectedSystems[systemIndex].actions[actionIndex] = {
                ...action, 
                timeline: [
                    ...timeline,
                    timelineItem
                ]
            }
        }
    }

    return updatedIncident
}

const editTimelineEntryForAction = (incident: Incident, timelineItem: TimelineItem) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex, timelineEntryIndex } = getIndexesForActionTimelineEntryId(incident, timelineItem.id)

    if (systemIndex != -1 && actionIndex != -1 && timelineEntryIndex != -1) {
        const affectedSystem = updatedIncident.affectedSystems[systemIndex]
        const action = affectedSystem.actions![actionIndex]
        action.timeline[timelineEntryIndex] = timelineItem
    }

    return updatedIncident
}

const removeTimelineEntryFromAction = (incident: Incident, id: string) => {
    let updatedIncident = JSON.parse(JSON.stringify(incident))
    const { systemIndex, actionIndex, timelineEntryIndex } = getIndexesForActionTimelineEntryId(incident, id)

    if (systemIndex != -1 && actionIndex != -1 && timelineEntryIndex != -1) {
        const affectedSystem = updatedIncident.affectedSystems[systemIndex]
        const action = affectedSystem.actions![actionIndex]
        action.timeline = action.timeline!.filter((_: TimelineItem, idx: number) => idx != timelineEntryIndex )
    }

    return updatedIncident
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
        case 'unresolve_affected_system':
            return unresolveAffectedSystem(incident, payload as string)
        case 'add_action':
            return addAction(incident, payload as Action)
        case 'edit_action':
            return updateAction(incident, payload as Action)
        case 'resolve_action_chore':
            return resolveActionChore(incident, payload as string)
        case 'resolve_action_success':
            return resolveActionSuccess(incident, payload as string)
        case 'resolve_action_failure':
            return resolveActionFailure(incident, payload as ResolveActionPayload)
        case 'unresolve_action':
            return unresolveAction(incident, payload as string)
        case 'add_action_timeline_item':
            return addTimelineEntryToAction(incident, payload as TimelineItem)
        case 'edit_action_timeline_item':
            return editTimelineEntryForAction(incident, payload as TimelineItem)
        case 'remove_action_timeline_item':
            return removeTimelineEntryFromAction(incident, payload as string)



        default: {
            throw Error(`Unknown event type: ${type} payload:${payload}`);
        }
    }
}
