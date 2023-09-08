'use client'


import AffectedSystemForm from "@/app/components/affected-system/affected-system-form";
import Action from "@/app/components/action/action";
import {useContext, useState} from "react";
import {IncidentDispatchContext} from "@/app/contexts/incident-context";
import ActionForm from "@/app/components/action/action-form";
import {Button, Popover, Typography} from "antd";
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
        <section data-test={`affected-system__${affectedSystem.status == 'Active' ? 'active' : 'past'}`}>
            {
                showSelfForm &&
                <AffectedSystemForm
                  affectedSystem={affectedSystem}
                  onCancel={cancelSelfForm}
                  onSubmit={editAffectedSystem}
                />
            }

            {
                !showSelfForm &&
                <div className="p-1">
                    <Popover content={
                        <>
                            <Button data-test="button-resolve-affected-system" className="block" icon={<CheckOutlined/>} onClick={resolve}>Resolve</Button>
                            <Button data-test="button-edit-affected-system" className="block" icon={<EditOutlined/>} onClick={onEditClick}>Edit</Button>
                        </>
                    }>
                      <div data-test="affected-system-what" className="bg-slate-500 -m-1 p-1 text-white">{affectedSystem.what}</div>
                    </Popover>

                      <div className="bg-slate-500 -m-1 p-1">
                          {!showNewActionForm &&
                            <Button 
                                style={{color: 'white'}} type="dashed" size="small" icon={<PlusOutlined/>} onClick={() => { setShowNewActionForm(true) }}
                                data-test="actions__active__add_action"
                            >
                              Add Action
                            </Button>
                          }
                      </div>

                    <section className="mt-2">
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

                        <ul data-test="actions__active">
                            {
                                affectedSystem.actions?.filter(a => a.status == 'Active').map((action) => {
                                    return (
                                        <li key={action.id} className="mb-2 border-solid pb-2 border-b-2 border-slate-30 last:border-b-0 last:pb-0">
                                            <Action action={action} />
                                        </li>
                                    )
                                })
                            }
                        </ul>

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
                </div>
            }

        </section>
    )
}