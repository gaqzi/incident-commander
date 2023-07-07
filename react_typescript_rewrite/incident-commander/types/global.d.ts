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
        timerDurationInMinutes?: number
        isMitigating: boolean
        status: string
        resolution?: string
        affectedSystemId?: string
    }

    type AffectedSystem = {
        id?: string
        what: string
        status: string
        actions: Action[]
    }

    type ResourceLink = {
        id: string
        name: string
        url: string
    }

    type IncidentSummary = {
        what: string
        whenUtcString: string
        where: string
        impact: string
        status: string
        resourceLinks: ResourceLink[]
    }
}