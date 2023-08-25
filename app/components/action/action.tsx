'use client'

import ActionForm from "@/app/components/action/action-form";
import {useContext, useState} from "react";
import {IncidentDispatchContext, NotificationsContext} from "@/app/contexts/incident-context";
import CountdownTimer from "@/app/components/countdown-timer";
import {Button, Popover} from "antd";
import {CheckOutlined, CloseOutlined, EditOutlined} from "@ant-design/icons";

interface props {
    action: Action
}

export default function Action({action}: props) {
    const [showForm, setShowForm] = useState(false)
    const incidentReducer = useContext(IncidentDispatchContext)
    const notificationPermission = useContext(NotificationsContext)
    const updateAction = (data) => {
        // TODO emit event instead
        // setAction(data)
        setShowForm(false)
        incidentReducer([{type: 'edit_action', payload: data}])
    }
    const cancelForm = () => {
        setShowForm(false)
    }
    const onEditClick = () => {
        setShowForm(true)
    }

    const resolveActionSuccess = () => {
        incidentReducer([{type: 'resolve_action_success', payload: action.id}])
    }

    const resolveActionFailure = () => {
        incidentReducer([{type: 'resolve_action_failure', payload: action.id}])
    }

    return (
        <section>
            {showForm &&
              <div className=""><ActionForm action={action} onSubmit={updateAction} onCancel={cancelForm}/></div>
            }
            {!showForm &&
              <div>
                <Popover
                  content={
                      <>
                          <Button 
                            className="block" 
                            size="small" 
                            icon={<EditOutlined/>} 
                            onClick={onEditClick}
                            data-test="action__edit"
                            >
                              Edit Action
                          </Button>

                          <Button
                            className="block finish action success"
                            icon={<CheckOutlined/>}
                            size="small"
                            data-test="active_action__succeeded"
                            onClick={resolveActionSuccess}
                        >
                            Mark Success
                        </Button>

                        <Button
                        className="block finish action failed"
                        icon={<CloseOutlined/>}
                        size="small"
                        data-test="active_action__failed"
                        onClick={resolveActionFailure}
                        >
                            Mark Failure
                        </Button>
                      </>
                  }
                >
                    <span className="description">
                        <span className="what" data-test="active_action__what">{action.what}</span> <br/>
                        @<span className="who" data-test="active_action__who">{action.who}</span>
                        {
                          action.link &&
                          <a className="ml-1" href={action.link} data-test="active_action__link">link</a>
                        }
                    </span>
                </Popover>

                <span className="action-group">
                    {
                        action.timerDurationInMinutes &&
                        <div className="block">
                          <CountdownTimer
                           id={`countdown-${action.id}`}
                           durationInMinutes={action.timerDurationInMinutes}
                           label={action.what}
                           onCompleted={(id, label)=> {
                              if (notificationPermission) {
                                  new Notification(label) // eslint-disable-line no-new
                              }
                           }}
                          />
                        </div>
                    }

                    <div>
                        Mitigating?
                        <input
                          type="checkbox"
                          name="is_action"
                          checked={action.isMitigating}
                          readOnly
                          data-test="action__is-mitigating"
                        />
                    </div>

                    {
                        action.status != 'Active' &&
                      <span className="block">{action.status}</span>
                    }
                </span>
              </div>
            }
        </section>
    )
}