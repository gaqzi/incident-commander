'use client'


import AffectedSystemForm from "@/app/components/affected-system/affected-system-form";
import Action from "@/app/components/action/action";
import {useContext, useState, useRef, useEffect} from "react";
import {IncidentDispatchContext, YDocContext, YDocMultiplayerProviderContext} from "@/app/contexts/incident-context";
import ActionForm from "@/app/components/action/action-form";
import {Button, Card, List, Popover, Space, Tooltip, Typography} from "antd";
import {CheckOutlined, EditOutlined, PlusOutlined, UndoOutlined} from "@ant-design/icons";
import {uuidv4} from "lib0/random";


export default function AffectedSystem({affectedSystem}: {affectedSystem: AffectedSystem}) {
    const [showSelfForm, setShowSelfForm] = useState(false)
    const [showNewActionForm, setShowNewActionForm] = useState(false)
    const incidentReducer = useContext(IncidentDispatchContext)

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

    const ResolveAffectedSystem = <Button key="resolve" icon={<CheckOutlined />} data-test="button-resolve-affected-system" onClick={resolve}>Resolve</Button>
    
    const UnresolveAffectedSystem = <Button key="unresolve" icon={<UndoOutlined />} data-test="button-unresolve-affected-system" onClick={unresolve}>Unresolve</Button>

    // const AddAction =
    // <Button icon={<PlusOutlined /> data-test="actions__active__add_action" onClick={() => { setShowNewActionForm(true) }}></Button>
    //         </Tooltip>

    const EditAffectedSystem = 
            <Button key="edit" icon={<EditOutlined />} data-test="button-edit-affected-system" onClick={onEditClick}>Edit</Button>


    const actions_list = affectedSystem.status == "Active"
        ? [EditAffectedSystem, ResolveAffectedSystem]
        : [EditAffectedSystem, UnresolveAffectedSystem]


    return (
        <Card 
            title={affectedSystem.what} 
            className={affectedSystem.status == "Active" ? "shadow-lg" : ''}
            extra={
                <Space.Compact block>
                    {actions_list}
                </Space.Compact>
            } 
            data-test={`affected-system__${affectedSystem.status == 'Active' ? 'active' : 'past'}`}
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

                        <section>
                            <ul data-test="actions__active" className="grid grid-cols-3 gap-4">
                                {
                                    affectedSystem.actions?.filter(a => a.status == 'Active').map((action) => {
                                        return (
                                            <li key={action.id} className="action mb-2 border-none pb-2 border-b-2 border-slate-30 last:border-b-0 last:pb-0">
                                                <Action action={action} />
                                            </li>
                                        )
                                    })
                                }

                                <li key={`${affectedSystem.id}_add_action`}>
                                    <Button type={affectedSystem.status == 'Active' ? 'primary' : 'default'} data-test="actions__active__add_action" size="large" key="btn_add_action" icon={<PlusOutlined/>} onClick={() => { setShowNewActionForm(true) }}>
                                        Add Action
                                    </Button>
                                </li>
                            </ul>
                        </section>

                        { 
                            affectedSystem.actions!.filter(a => a.status != 'Active').length > 0
                            &&
                            <section className="mt-4 text-slate-400">
                                <ul data-test="actions__inactive" className="grid grid-cols-3 gap-4">
                                    {
                                        affectedSystem.actions?.filter(a => a.status != 'Active').map((action) => {
                                            return (
                                                <li key={action.id} className="action mb-2 border-solid border-0 pb-2 border-b-2 border-slate-30 last:border-b-0 last:pb-0">
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