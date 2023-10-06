'use client'

import ActionForm from "@/app/components/action/action-form";
import {useContext, useState} from "react";
import {IncidentDispatchContext, NotificationsContext} from "@/app/contexts/incident-context";
import CountdownTimer from "@/app/components/countdown-timer";
import {Button, Popover, Tooltip} from "antd";
import {CheckOutlined, ClockCircleOutlined, CloseOutlined, EditOutlined, InfoCircleOutlined, CheckCircleOutlined, MoreOutlined, MenuOutlined } from "@ant-design/icons";

interface props {
    action: Action
}

export default function Action({action}: props) {
    const [showForm, setShowForm] = useState(false)
    const incidentReducer = useContext(IncidentDispatchContext)
    const notificationPermission = useContext(NotificationsContext)
    const updateAction = (data: Action) => {
      setShowForm(false)
      if (data.timer && data.timer.durationInMinutes! >= 0) {
        data.timer.isRunning = true
        data.timer.startedAtUtc = new Date(Date.now()).toUTCString()
      }
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
        const resolution = prompt('Why did this fail to resolve the issue?')
        if (resolution == null) {
          return;
        }
        incidentReducer([{type: 'resolve_action_failure', payload: { actionId: action.id, resolution } }])
    }

    return (
        <section>
            {showForm &&
              <div className=""><ActionForm action={action} onSubmit={updateAction} onCancel={cancelForm}/></div>
            }
            {!showForm &&
              <div className="flex flex-row">
                <div className="basis-11/12">
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
                  {
                    action.isMitigating?
                    <Tooltip title="This might mitigate things" className="mr-2">
                      <CheckCircleOutlined title="Is Mitigating" data-test="action__is-mitigating" />
                    </Tooltip>
                    :
                    <Tooltip title="We want more info" className="mr-2">
                      <InfoCircleOutlined title="Provides Info" />
                    </Tooltip>
                  }

                    <span className="description">
                          <span className="what" data-test="active_action__what">{action.what}</span>

                          {
                            action.link &&
                            <span> - <a className="ml-1" target="_blank" href={action.link} data-test="active_action__link">link</a></span>
                          }


                        {
                          action.who ?
                          <span><br/>@<span className="who italic" data-test="active_action__who">{action.who}</span></span>
                          :
                          <span className="italic"><br/>Unassigned</span>
                        }
                    </span>
                </Popover>

                <span className="action-group">
                    {
                        action.timer &&
                        <div className="block">
                          <ClockCircleOutlined title="Timer" />
                          <div className="ml-2 inline-block">
                            <CountdownTimer
                            onEditClick={()=>{setShowForm(true)}}
                            id={`countdown-${action.id}`}
                            action={action}
                            label={action.what}
                            onCompleted={(id, label)=> {
                                if (notificationPermission && label && typeof Notification !== 'undefined') {
                                    new Notification(label) // eslint-disable-line no-new
                                }
                            }}
                            />
                          </div>
                        </div>
                    }

                    {
                        action.status != 'Active' &&
                        <>
                          <span className="block">{action.status}</span>
                          <span className="block">{action.resolution}</span>
                        </>
                    }
                </span>
                </div>

                <div className="basis-1/12">
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
                    <MoreOutlined title="Actions..." className="p-2" />
                  </Popover>
                </div>
              </div>
            }
        </section>
    )
}
