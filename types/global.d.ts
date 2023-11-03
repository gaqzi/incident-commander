export {}

declare global {
    // For some reason, global enum definitions here gives an undefined error when using in a component.
    // Switching to strings for now and will try to refactor later...
    // enum IncidentStatus {
    //     Investigating = "Investigating",
    //     Identified = "Identified",
    //     Monitoring = "Monitoring",
    //     Resolved = "Resolved",
    // }
    //
    // enum ActionStatus {
    //     Active = "Active",
    //     Resolved = "Resolved",
    // }
    //
    // enum AffectedSystemStatus {
    //     Active = "Active",
    //     Resolved = "Resolved",
    // }
    //
    // enum Resolution {
    //     Success = "Success",
    //     Failure = "Failure",
    // }

    type Action = {
        id?: string
        what: string
        who?: string
        link?: string
        timer?: Timer
        status: string
        resolution?: string
        affectedSystemId?: string
        timeline?: TimelineItem[]
    }

    type TimelineItem = {
        id: string
        parentId: string
        timestampUtc: string
        text: string
    }
     
    type Timer = {
        durationInMinutes: number
        startedAtUtc: string
        isRunning: boolean
    }

    type AffectedSystem = {
        id?: string
        what: string
        status?: string
        actions?: Action[]
        addDefaultActions?: boolean
    }

    type ResourceLink = {
        id: string
        name: string
        url: string
    }

    type IncidentSummary = {
        _isNew: boolean
        what: string
        whenUtcString: string
        where: string
        impact: string
        status: string
        resourceLinks: ResourceLink[]
        addDefaultActions?: boolean
    }

    type Incident = {
        id: string
        summary: IncidentSummary
        affectedSystems: AffectedSystem[]
    }
}