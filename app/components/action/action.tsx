'use client'

import ActionForm from "@/app/components/action/action-form";
import {Children, Component, PropsWithChildren, useContext, useState} from "react";
import {IncidentDispatchContext, NotificationsContext} from "@/app/contexts/incident-context";
import CountdownTimer from "@/app/components/countdown-timer";
import {Button, Popover, Radio, Tooltip} from "antd";
import {CheckOutlined, ClockCircleOutlined, EditOutlined, LikeOutlined, DislikeOutlined, CheckCircleOutlined, MoreOutlined, MenuOutlined } from "@ant-design/icons";


const NOTIFICATION_REMEMBERING_LOCALSTORAGE_KEY = 'previousNotifications'
function rememberNotification(id: string) {
  // if (! localStorage.getItem(KEY)) {
  //   localStorage.setItem(KEY, JSON.stringify({}))
  // }
  // TODO: consider how to clean old ones up. Perhaps store id along with a TTL and clean up old entries every so often?
  let previousNotifications = JSON.parse(localStorage.getItem(NOTIFICATION_REMEMBERING_LOCALSTORAGE_KEY) || "{}")
  previousNotifications[id] = true
  localStorage.setItem(NOTIFICATION_REMEMBERING_LOCALSTORAGE_KEY, JSON.stringify(previousNotifications))
}
function didAlreadyNotify(id: string) {
  let previousNotifications = JSON.parse(localStorage.getItem(NOTIFICATION_REMEMBERING_LOCALSTORAGE_KEY) || "{}")
  return previousNotifications[id]
}


interface props {
    action: Action
}



export default function Action({action}: props) {
    const [showForm, setShowForm] = useState(false)
    const incidentReducer = useContext(IncidentDispatchContext)
    const notificationPermission = useContext(NotificationsContext)
    const updateAction = (data: Action) => {
      setShowForm(false)
      if (data.timer && data.timer.durationInMinutes! >= 0 && data.timer.durationInMinutes != action.timer?.durationInMinutes) {
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

    const unresolveAction = () => {
        incidentReducer([{type: 'unresolve_action', payload: action.id}])
    }

    const resolveActionChore = () => {
        incidentReducer([{type: 'resolve_action_chore', payload: action.id}])
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

    const updateActionStatus = (e: any) => {
      switch(e.target.value) {
        case 'Active': unresolveAction(); break;
        case 'Chore': resolveActionChore(); break;
        case 'Success': resolveActionSuccess(); break;
        case 'Failure': resolveActionFailure(); break;
        default: console.error(`Don't know how to handle updating action to status ${e.target.value}`)
      }
    }


    const ButtonsPopover = (props: PropsWithChildren) => {
      return <Popover content={
        <>
          <Button 
            className="block mb-1" 
            type="link"
            size="medium" 
            icon={<EditOutlined/>} 
            onClick={onEditClick}
            data-test="action__edit"
            >
              Edit Action
          </Button>

          <Radio.Group defaultValue={action.status} buttonStyle="solid" onChange={updateActionStatus}>
            <Radio.Button value="Active" data-test="action__reactivate">
              Active
            </Radio.Button>

            <Radio.Button value="Chore" data-test="action__resolve_chore">
              <CheckOutlined className="mr-1" /> Was Chore
            </Radio.Button>

            <Radio.Button value="Success" data-test="action__resolve_success">
              <LikeOutlined className="mr-1" /> This Helped
            </Radio.Button>

            <Radio.Button value="Failure" data-test="action__resolve_failure">
              <DislikeOutlined className="mr-1" /> This Didn't Help
            </Radio.Button>
          </Radio.Group>
        </>
        }
        >
          {props.children}
        </Popover>
    }

    const icon = () => {
      switch (action.status) {
        case 'Active':  return <></>;
        case 'Chore':   return <CheckOutlined />;
        case 'Success': return <LikeOutlined />;
        case 'Failure': return <DislikeOutlined />;
        default:        return <></>;
      }
    }

    return (
        <section>
            {showForm &&
              <div className=""><ActionForm action={action} onSubmit={updateAction} onCancel={cancelForm}/></div>
            }
            {!showForm &&
              <div className="flex flex-row">
                <div className="basis-11/12">
                <ButtonsPopover>
                    {icon()}

                    <span className="ml-1">
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
                </ButtonsPopover>

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
                            onCompleted={(id, label, expiresAtMs)=> {
                                if (notificationPermission && label && typeof Notification !== 'undefined') {
                                  // We don't want to alert for the same notification id twice (browser refresh, etc)
                                  // so we'll track ones we've already notified for in localstorage
                                  const notificationId = action.id! + expiresAtMs?.toString()
                                  if (!didAlreadyNotify(notificationId)) {
                                    new Notification(label) // eslint-disable-line no-new
                                    rememberNotification(action.id! + expiresAtMs?.toString())
                                  }
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
                  <ButtonsPopover>
                    <MoreOutlined title="Actions..." className="p-2" />
                  </ButtonsPopover>
                </div>
              </div>
            }
        </section>
    )
}
