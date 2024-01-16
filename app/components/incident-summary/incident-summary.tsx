'use client'

import ResourceLink from "@/app/components/resource-link/resource-link";
import {useContext, useState, useEffect, useCallback} from "react";
import {IncidentDispatchContext, YDocContext, YDocMultiplayerProviderContext} from "@/app/contexts/incident-context";
import ResourceLinkForm from "@/app/components/resource-link/resource-link-form";
import IncidentSummaryForm from "@/app/components/incident-summary/incident-summary-form";
import { Button, Modal, Popover, Tooltip } from "antd"
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import {uuidv4} from "lib0/random";
import { QuillBinding } from 'y-quill'

export default function IncidentSummary({incident, showForm}: {incident: Incident, showForm: boolean}) {
    const summary = incident.summary
    const incidentReducer = useContext(IncidentDispatchContext)

    const [showSummaryForm, setShowSummaryForm] = useState(incident.summary._isNew)
    useEffect(()=>{
        setShowSummaryForm(incident.summary._isNew)
    }, [incident])


    const ydoc = useContext(YDocContext)
    const ydocProvider = useContext(YDocMultiplayerProviderContext)
    const ytext = ydoc.getText(`${incident.id}__quill`)

    const editorRef = useCallback(async (node: any) => {
        if (node !== null) {

        // We need to load Quill dynamically here because it only works client-side
        const Quill = (await import('quill')).default
        const QuillCursors = (await import('quill-cursors')).default
        Quill.register('modules/cursors', QuillCursors)

        const editor = new Quill(node, {
            modules: {
              cursors: true,
              toolbar: false,
              history: {
                userOnly: true
              }
            },
            placeholder: 'Type notes here if you need them...',
            theme: 'snow' // or 'bubble'
          })
        
        new QuillBinding(ytext, editor, ydocProvider!['awareness'])
        }
    }, [])

    const updateSummary = (data: any) => { // TODO: fix sig
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
        incidentReducer([{type: 'add_incident_resource_link', payload: {...resourceLink, id: `link_${uuidv4()}`}}])
        setResourceLinkFormVisible(false)
    }

    const incidentReport = ({title, includeActions, includeResources}: {title: string, includeActions: boolean, includeResources: boolean}) => {
        const { what, where, impact, whenUtcString, status } = incident.summary
        let lines = [title]
        lines.push(`*${status}*`)
        lines.push(`Since ${whenUtcString} we are seeing ${what} in ${where} impacting ${impact}.`)

        if (includeResources) {
            lines.push(``)
            lines.push(`*Resources:*`)
            incident.summary.resourceLinks.forEach(l => {
                lines.push(`- [${l.name}](${l.url})`)
            });
        }

        lines.push(``)
        lines.push(`*Current status:*`)

        incident.affectedSystems.forEach(system => {
            let statusIcon = system.status == 'Active' ? '🔴' : '✅'
            lines.push(`- ${statusIcon} ${system.what}`)

            if (includeActions) {
                // We want all active actions
                const activeActions = system.actions?.filter(a => a.status == 'Active')
                // And all resolved actions that are not a Chore
                const resolvedActions = system.actions?.filter(a => ['Success', 'Failure'].includes(a.status))
                if (activeActions!.length > 0) {
                    lines.push(`    *Actions:*`)
                    activeActions!.forEach(action => {
                        let line = `    - ${action.what}`
                        if (action.who)  {
                            line += ` (@${action.who})`
                        }
                        if (action.link) {
                            line += ` [More info](${action.link})`
                        }
                        lines.push(line)
                        // Include all timeline entries for this action
                        if (action.timeline && action.timeline.length > 0) {
                            action.timeline.reverse().forEach(entry => {
                                lines.push(`        - ${entry.text}`)
                            })
                        }
                    })
                }
                if (resolvedActions!.length > 0) {
                    lines.push(``)
                    lines.push(`    *Past Actions:*`)
                    resolvedActions!.forEach(action => {
                        const symbol = action.status == 'Success' ? '✔️' : '❌'
                        let line = `    - ${symbol} ${action.what}`
                        if (action.who)  {
                            line += ` (@${action.who})`
                        }
                        if (action.link) {
                            line += ` [More info](${action.link})`
                        }
                        if (action.resolution) {
                            line += ` -- ${action.resolution}`
                        }
                        lines.push(line)
                        // Include all timeline entries for this action
                        if (action.timeline && action.timeline.length > 0) {
                            action.timeline.reverse().forEach(entry => {
                                lines.push(`        - ${entry.text}`)
                            })
                        }
                    })
                }
            }
            lines.push(``)
        })

        return lines.join('\n').trim()
    }

    const copyBusinessUpdate = async () => {
        const update = incidentReport({title: 'Business Update', includeActions: false, includeResources: false})
        console.log(update)
        await navigator.clipboard.writeText(update)
    }

    const copyTechUpdate = async () => {
        const update = incidentReport({title: 'Tech Update', includeActions: true, includeResources: true})
        console.log(update)
        await navigator.clipboard.writeText(update)
    }

    return (
        <div>
            {
                showSummaryForm &&
                <IncidentSummaryForm summary={summary} onSubmit={updateSummary} onCancel={cancelSummaryForm}/>
            }

            {
                !showSummaryForm &&
                <>
                    <h2>
                        Summary

                        <Tooltip title="Edit Summary" className="text-sm font-normal">
                            <EditOutlined className="ml-2" data-test="button-edit-summary" title="Edit Summary" onClick={onSummaryEditClick} />
                        </Tooltip>
                    </h2>

                    <div className="message" data-test="summary">
                        <strong className="status">[{summary.status}]</strong>
                        <table>
                            <tbody>
                                <tr><td>Since:</td><td><span className="when">{summary.whenUtcString}</span></td></tr>
                                <tr><td>What:</td><td><span className="what">{summary.what}</span></td></tr>
                                <tr><td>Where:</td><td><span className="where">{summary.where}</span></td></tr>
                                <tr><td className="pr-2">Impact:</td><td><span className="impact">{summary.impact}</span></td></tr>
                            </tbody>
                        </table>

                    </div>

                    <div className="incident-summary__actions mt-4">
                        <Button data-test="button-business-update" onClick={copyBusinessUpdate}>Copy Business Update</Button>
                        <Button data-test="button-tech-update" onClick={copyTechUpdate}>Copy Tech Update</Button>
                    </div>



                    <div data-test="incident-summary__resources" className="incident-summary__links mt-4">
                        <h3>
                            Resources
                            <Button data-test="button-add-resource" type="text" size={"small"} icon={<PlusOutlined />} onClick={addResourceLinkClick}>Add Resource</Button>
                        </h3>

                        {
                            resourceLinkFormVisible &&
                            <Modal
                                title="Edit Resource Link"
                                open={resourceLinkFormVisible}
                                onCancel={onResourceLinkFormCancel}
                                footer={null}
                            >
                                <ResourceLinkForm resourceLink={undefined} onSubmit={addResourceLink} onCancel={onResourceLinkFormCancel}/>
                            </Modal>
                        }

                        <ul className="incident-summary__links__list">
                            { summary.resourceLinks.map(l => <li key={l.url} className="inline-block mr-4"><ResourceLink resourceLink={l}/> </li>) }
                        </ul>
                    </div>

                    <h3 className="mt-2">Notes</h3>
                    <section className="border-solid border-2 border-slate-200">
                        <div ref={editorRef} data-test="notes"></div>
                    </section>
                </>
            }


        </div>
    )
}
