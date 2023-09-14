'use client'


import AffectedSystemForm from "@/app/components/affected-system/affected-system-form";
import Action from "@/app/components/action/action";
import {useContext, useState} from "react";
import {IncidentDispatchContext} from "@/app/contexts/incident-context";
import ActionForm from "@/app/components/action/action-form";
import {Button, Card, List, Popover, Tooltip, Typography} from "antd";
import {CheckOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {uuidv4} from "lib0/random";
const { Text } = Typography;

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

    const addAction = (data: any) => {
        setShowNewActionForm(false)
        incidentReducer([{type: 'add_action', payload: {...data, id: `action_${uuidv4()}` }}])
    }

    return (
        <Card 
            title={affectedSystem.what} 
            className="shadow-md"
            extra={
                <Tooltip title="Edit Affected System">
                    <EditOutlined key="edit" data-test="button-edit-affected-system" onClick={onEditClick} />
                </Tooltip>
            } 
            data-test={`affected-system__${affectedSystem.status == 'Active' ? 'active' : 'past'}`}
            actions={[
                <Tooltip title="Resolve Affected System">
                    <CheckOutlined key="resolve" data-test="button-resolve-affected-system" onClick={resolve} />
                </Tooltip>,

                <Tooltip title="Add Action">
                    <PlusOutlined key="add-action" data-test="actions__active__add_action" onClick={() => { setShowNewActionForm(true) }} />
                </Tooltip>,
              ]}
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
                    </section>
            }
            </div>

        </Card>
    )
}