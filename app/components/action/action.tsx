'use client'

import ActionForm from "@/app/components/action/action-form";
import {Children, Component, PropsWithChildren, useContext, useState} from "react";
import {IncidentDispatchContext, NotificationsContext} from "@/app/contexts/incident-context";
import CountdownTimer from "@/app/components/countdown-timer";
import {Button, Card, Collapse, CollapseProps, ConfigProvider, Input, Popover, Radio, Space, Tag, Timeline, Tooltip} from "antd";
import Icon, {SettingOutlined, CaretDownOutlined, CaretRightOutlined, LinkOutlined, RightOutlined, DeleteOutlined, CheckOutlined, ClockCircleOutlined, EditOutlined, LikeOutlined, DislikeOutlined, CheckCircleOutlined, MoreOutlined, MenuOutlined } from "@ant-design/icons";
import {uuidv4} from "lib0/random";
import TextArea from "antd/es/input/TextArea";
import TimelineEntry from "../timeline-entry/timeline-entry";

const ExternalLinkSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 30 30" width="15px" height="15px" fill="currentColor"><path d="M 25.980469 2.9902344 A 1.0001 1.0001 0 0 0 25.869141 3 L 20 3 A 1.0001 1.0001 0 1 0 20 5 L 23.585938 5 L 13.292969 15.292969 A 1.0001 1.0001 0 1 0 14.707031 16.707031 L 25 6.4140625 L 25 10 A 1.0001 1.0001 0 1 0 27 10 L 27 4.1269531 A 1.0001 1.0001 0 0 0 25.980469 2.9902344 z M 6 7 C 4.9069372 7 4 7.9069372 4 9 L 4 24 C 4 25.093063 4.9069372 26 6 26 L 21 26 C 22.093063 26 23 25.093063 23 24 L 23 14 L 23 11.421875 L 21 13.421875 L 21 16 L 21 24 L 6 24 L 6 9 L 14 9 L 16 9 L 16.578125 9 L 18.578125 7 L 16 7 L 14 7 L 6 7 z"/></svg>
)

const ExternalLinkIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={ExternalLinkSvg} {...props} />
)


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
            size="middle"
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
              <DislikeOutlined className="mr-1" /> This Didn&apos;t Help
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

    const [timelineEntryText, setTimelineEntryText] = useState('')

    const addTimelineEntry = () => {
      const timelineEntry = {
        id: `timeline_entry_${uuidv4()}`,
        parentId: action.id,
        timestampUtc: new Date().toUTCString(),
        text: timelineEntryText,
      }
      incidentReducer([{type: 'add_action_timeline_item', payload: timelineEntry }])
      setTimelineEntryText('')
    }

    const addTimelineForm =
        <Space.Compact style={{ width: '100%' }}>
          <TextArea 
             autoSize 
             className="rounded-none mb-2"
             onChange={(e)=>setTimelineEntryText(e.target.value)}
             onKeyDown={(e)=>{ if(e.key === 'Enter'){ addTimelineEntry(); e.preventDefault() } }}
             value={timelineEntryText}
             placeholder="Add action timeline note" 
          /> 

          <Button type="default" onClick={addTimelineEntry}>
            Add
          </Button> 
        </Space.Compact>

    const [timelineExpanded, setTimelineExpanded] = useState(false)

    let allTimelineItems: any[] = (action.timeline || [])
      .map(i => { return { 
          children: <TimelineEntry i={i} />, 
        } 
      })
      .reverse()
    allTimelineItems.splice(0, 0, 
      {
        color: 'gray',
        children: (addTimelineForm),
      },
    )
    allTimelineItems.splice(4, 0, 
      {
        color: 'gray',
        dot: <CaretDownOutlined />,
        children: (<span className="p0 m0 cursor-pointer" onClick={() => setTimelineExpanded((v)=>!v) }>Hide older entries </span>),
      }
    )

    let collapsedTimelineItems: any[] = [
        {
          color: 'gray',
          children: (addTimelineForm),
        },
    ]
    if (action.timeline && action.timeline.length > 0) {
        collapsedTimelineItems = collapsedTimelineItems.concat([
        ...allTimelineItems.slice(1,4),
        {
          color: 'gray',
          dot: <CaretRightOutlined />,
          children: (<Tag className="cursor-pointer" onClick={() => setTimelineExpanded((v)=>!v) }>Show {allTimelineItems.length - 5} more entries ...</Tag>),
        },
      ])
    }

    const timelineItems = timelineExpanded ? allTimelineItems : collapsedTimelineItems

    return (
        <Card 
          type="inner" 
          title={action.what}
          data-test="action-card"
          className={["action-card", (action.status == 'Active' ? '' : 'action-card-completed')].join(' ')}
          extra={<>
              { action.link &&
                  <a className="ml-1" target="_blank" href={action.link} data-test="active_action__link">
                <Tag icon={<ExternalLinkIcon />} color="blue">Link</Tag>
                  </a>
              }

              {
                  action.status != 'Active' &&
                  <Tag color="#999" bordered={false}>
                    {icon()} <span>{action.status}</span>
                  </Tag>
              }

              <ButtonsPopover>
                <Tag icon={<SettingOutlined />}></Tag>
              </ButtonsPopover>
            </>
          }
        >
            {showForm &&
              <div className=""><ActionForm action={action} onSubmit={updateAction} onCancel={cancelForm}/></div>
            }

            {!showForm &&
              <div>


              <div className="flex flex-row">
                <div>

                {/* Status ------------------ */}
                    {
                        action.status == 'Failure' &&
                        <div>
                          <span>{action.status}</span> reason: <span>{action.resolution}</span>
                        </div>
                    }
                    </div>
                </div>

              <div className="flex flex-row justify-between">
                <div>
                  {/* What & Who ------------- */}

                  <span>
                      {
                        action.who ?
                        <span>@<span className="who italic" data-test="active_action__who">{action.who}</span></span>
                        :
                        <span className="italic">Unassigned</span>
                      }
                  </span>
                </div>
                <div>
                {/* Timer ------------------ */}
                {/* <span className="action-group"> */}
                    {
                        action.timer &&
                        <div className="block">

                          <div className="inline-block">
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
                </div>
              </div>



                {/* Timeline ------------------ */}
                <Timeline className="mt-4" items={timelineItems} /> 

              </div>
            }
        </Card>
    )
}
