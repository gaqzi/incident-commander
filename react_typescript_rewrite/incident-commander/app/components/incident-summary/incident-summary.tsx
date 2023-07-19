'use client'

import ResourceLink from "@/app/components/resource-link/resource-link";
import {useContext, useState, useEffect} from "react";
import {IncidentDispatchContext} from "@/app/contexts/incident-context";
import ResourceLinkForm from "@/app/components/resource-link/resource-link-form";
import IncidentSummaryForm from "@/app/components/incident-summary/incident-summary-form";
import { Button, Modal, Popover } from "antd"
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import {Incident} from "@/app/components/ongoing-incident/reducer";
import {uuidv4} from "lib0/random";

export default function IncidentSummary({incident}: {incident: Incident}) {
    const summary = incident.summary
    const incidentReducer = useContext(IncidentDispatchContext)

    const [showSummaryForm, setShowSummaryForm] = useState(incident.summary._isNew)
    useEffect(()=>{
        setShowSummaryForm(incident.summary._isNew)
    }, [incident])

    const updateSummary = (data) => {
        setShowSummaryForm(false)
        incidentReducer([{type: 'edit_incident_summary', payload: data}])
    }
    const cancelSummaryForm = () => {
        setShowSummaryForm(false)
    }
    const onSummaryEditClick = () => {
        setShowSummaryForm(true)
    }

    const [resourceLinkFormVisible, setResourceLinkFormVisible] = useState(false)
    const addResourceLinkClick = () => {
        setResourceLinkFormVisible(true)
    }
    const onResourceLinkFormCancel = () => {
        setResourceLinkFormVisible(false)
    }
    const addResourceLink = (resourceLink: ResourceLink) => {
        incidentReducer([{type: 'add_incident_resource_link', payload: {resourceLink, id: `link_${uuidv4()}`}}])
        setResourceLinkFormVisible(false)
    }

    const incidentReport = ({title, includeActions}: {title: string, includeActions: boolean}) => {
        const { what, where, impact, whenUtcString, status } = incident.summary
        let lines = [title]
        lines.push(`*${status}*`)
        lines.push(`Since ${whenUtcString} we are seeing ${what} in ${where} impacting ${impact}.`)

        lines.push(``)
        lines.push(`*Current status:*`)

        incident.affectedSystems.forEach(system => {
            let statusIcon = system.status == 'Active' ? '🔴' : '✅'
            lines.push(`- ${statusIcon} ${system.what}`)

            if (includeActions) {
                // Note: We always still skip all actions where isMitigating is false
                const activeActions = system.actions.filter(a => a.status == 'Active' && a.isMitigating)
                const resolvedActions = system.actions.filter(a => a.status != 'Active' && a.isMitigating)
                if (activeActions.length > 0) {
                    lines.push(`    *Actions:*`)
                    activeActions.forEach(action => {
                        lines.push(`    - ${action.what} [@${action.who}]`)
                    })
                }
                if (resolvedActions.length > 0) {
                    lines.push(``)
                    lines.push(`    *Resolved Actions:*`)
                    resolvedActions.forEach(action => {
                        const symbol = action.status == 'Success' ? '✔️' : '❌'
                        lines.push(`    - ${symbol} ${action.what} [@${action.who}`)
                    })
                }
            }
            lines.push(``)
        })

        return lines.join('\n')
    }

    const copyBusinessUpdate = async () => {
        const update = incidentReport({title: 'Business Update', includeActions: false})
        console.log(update)
        await navigator.clipboard.writeText(update)
    }

    const copyTechUpdate = async () => {
        const update = incidentReport({title: 'Tech Update', includeActions: true})
        console.log(update)
        await navigator.clipboard.writeText(update)
    }

    return (
        <div>
            {
                !showSummaryForm &&
                <>
                    <h2>Summary</h2>

                  <div className="incident-summary__actions">
                    <Button data-test="button-business-update" onClick={copyBusinessUpdate.bind(this, incident)}>Copy Business Update</Button>
                    <Button data-test="button-tech-update" onClick={copyTechUpdate}>Copy Tech Update</Button>
                  </div>

                    <div className="message max-w-xl" data-test="summary">
                      <Popover
                        title="Actions"
                        content={
                          <Button data-test="button-edit-summary" type="text" icon={<EditOutlined />} onClick={onSummaryEditClick}>Edit</Button>
                        }
                        >
                        <strong>Since</strong> <span className="when">{summary.whenUtcString}</span>
                        &nbsp;<strong>we are seeing</strong> <span className="what">{summary.what}</span>
                        &nbsp;<strong>in</strong> <span className="where">{summary.where}</span>
                        &nbsp;<strong>impacting</strong> <span className="impact">{summary.impact}</span>.
                      </Popover>
                    </div>
                    <div>
                      <strong className="status">{summary.status}</strong>
                    </div>
                </>
            }


            {
                showSummaryForm &&
                <IncidentSummaryForm summary={summary} onSubmit={updateSummary} onCancel={cancelSummaryForm}/>
            }

            <div className="incident-summary__links">
                <h3>
                    Resources
                    <Button type="text" size={"small"} icon={<PlusOutlined />} onClick={addResourceLinkClick}>Add Resource</Button>
                </h3>

                <Modal
                    title="Edit Resource Link"
                    open={resourceLinkFormVisible}
                    onCancel={onResourceLinkFormCancel}
                    footer={null}
                >
                  <ResourceLinkForm resourceLink={null} onSubmit={addResourceLink} onCancel={onResourceLinkFormCancel}/>
                </Modal>

                <ul className="incident-summary__links__list">
                    { summary.resourceLinks.map(l => <li key={l.url} className="inline-block mr-4"><ResourceLink resourceLink={l}/> </li>) }
                </ul>
            </div>

        </div>
    )
}