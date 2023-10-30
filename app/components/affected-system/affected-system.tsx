'use client'


import AffectedSystemForm from "@/app/components/affected-system/affected-system-form";
import Action from "@/app/components/action/action";
import {useContext, useState, useRef, useEffect} from "react";
import {IncidentDispatchContext, YDocContext, YDocMultiplayerProviderContext} from "@/app/contexts/incident-context";
import ActionForm from "@/app/components/action/action-form";
import {Button, Card, List, Popover, Tooltip, Typography} from "antd";
import {CheckOutlined, EditOutlined, PlusOutlined, UndoOutlined} from "@ant-design/icons";
import {uuidv4} from "lib0/random";
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'

Quill.register('modules/cursors', QuillCursors)

export default function AffectedSystem({affectedSystem}: {affectedSystem: AffectedSystem}) {
    const [showSelfForm, setShowSelfForm] = useState(false)
    const [showNewActionForm, setShowNewActionForm] = useState(false)
    const incidentReducer = useContext(IncidentDispatchContext)
    const ydoc = useContext(YDocContext)
    const ydocProvider = useContext(YDocMultiplayerProviderContext)
    const ytext = ydoc.getText(`${affectedSystem.id}__quill`)
    const editorRef = useRef(null)

    useEffect(()=>{
        const editor = new Quill(editorRef.current, {
            modules: {
              cursors: true,
              toolbar: false,
              history: {
                userOnly: true
              }
            },
            placeholder: 'Start collaborating...',
            theme: 'snow' // or 'bubble'
          })
        
        const binding = new QuillBinding(ytext, editor, ydocProvider!.awareness) //@ts-ignore
    })

    const onEditClick = () => {
        setShowSelfForm(true)
    }

    const editAffectedSystem = (data: any) => {
        setShowSelfForm(false)
        incidentReducer([{type: 'edit_affected_system', payload: data}])
    }

    const cancelSelfForm = () => {
        setShowSelfForm(false)
    }

    const resolve = () => {
        incidentReducer([{type: 'resolve_affected_system', payload: affectedSystem.id}])
    }

    const unresolve = () => {
        incidentReducer([{type: 'unresolve_affected_system', payload: affectedSystem.id}])
    }

    const addAction = (data: any) => {
        setShowNewActionForm(false)
        if (data.timer && data.timer.durationInMinutes > 0) {
            data.timer.isRunning = true
            data.timer.startedAtUtc = new Date(Date.now()).toUTCString()
        }
        incidentReducer([{type: 'add_action', payload: {...data, id: `action_${uuidv4()}` }}])
    }

    const ResolveAffectedSystem = <>
            <Tooltip title="Resolve Affected System" key="btn_resolve">
                <CheckOutlined key="resolve" data-test="button-resolve-affected-system" onClick={resolve} />
            </Tooltip>
        </>
    
    const UnresolveAffectedSystem =
            <Tooltip title="Unresolve Affected System" key="btn_unresolve">
                <UndoOutlined key="unresolve" data-test="button-unresolve-affected-system" onClick={unresolve} />
            </Tooltip>

    const AddAction = <>
            <Tooltip title="Add Action" key="btn_add_action">
                <PlusOutlined key="add-action" data-test="actions__active__add_action" onClick={() => { setShowNewActionForm(true) }} />
            </Tooltip>
        </>

    const actions_list = affectedSystem.status == "Active"
        ? [ResolveAffectedSystem, AddAction]
        : [UnresolveAffectedSystem, AddAction]


    return (
        <Card 
            title={affectedSystem.what} 
            className={affectedSystem.status == "Active" ? "shadow-lg" : ''}
            extra={
                <Tooltip title="Edit Affected System">
                    <EditOutlined key="edit" data-test="button-edit-affected-system" onClick={onEditClick} />
                </Tooltip>
            } 
            data-test={`affected-system__${affectedSystem.status == 'Active' ? 'active' : 'past'}`}
            actions={actions_list}
        >
            <div>
            {
                showSelfForm &&
                <AffectedSystemForm
                  affectedSystem={affectedSystem}
                  onCancel={cancelSelfForm}
                  onSubmit={editAffectedSystem}
                />
            }

            {
                    <section>
                        {
                          showNewActionForm &&
                          <div className="mb-4 pb-4 border-solid border-b-4 border-slate-400">
                              <ActionForm
                                action={{affectedSystemId: affectedSystem.id}}
                                onCancel={()=>{setShowNewActionForm(false)}}
                                onSubmit={addAction}
                              />
                          </div>
                        }
                        <section className="border-solid border-b-2 border-slate-400">
                            <div ref={editorRef} data-test="notes"></div>
                        </section>

                        <section>
                            <h4 className="font-bold">Active Actions</h4>

                            <ul data-test="actions__active">
                                {
                                    affectedSystem.actions?.filter(a => a.status == 'Active').map((action) => {
                                        return (
                                            <li key={action.id} className="mb-2 border-none pb-2 border-b-2 border-slate-30 last:border-b-0 last:pb-0">
                                                <Action action={action} />
                                            </li>
                                        )
                                    })
                                }
                            </ul>
                        </section>

                        { 
                            affectedSystem.actions!.filter(a => a.status != 'Active').length > 0
                            &&
                            <section className="mt-4 text-slate-400">
                                <h4 className="font-bold underlined">Completed Actions</h4>

                                <ul data-test="actions__inactive">
                                    {
                                        affectedSystem.actions?.filter(a => a.status != 'Active').map((action) => {
                                            return (
                                                <li key={action.id} className="mb-2 border-solid pb-2 border-b-2 border-slate-30 last:border-b-0 last:pb-0">
                                                    <Action action={action} />
                                                </li>
                                            )
                                        })
                                    }
                                </ul>
                            </section>
                        }
                    </section>
            }
            </div>

        </Card>
    )
}