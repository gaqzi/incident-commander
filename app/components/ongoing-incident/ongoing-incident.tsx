'use client'

import {useEffect, useReducer, useState} from 'react'
import {useForm} from 'react-hook-form'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {incidentReducer} from "@/app/components/ongoing-incident/reducer";

import IncidentSummary from "@/app/components/incident-summary/incident-summary";
import AffectedSystem from "@/app/components/affected-system/affected-system";
import AffectedSystemForm from "@/app/components/affected-system/affected-system-form";
import {NotificationsContext, IncidentDispatchContext, nullDispatch} from "@/app/contexts/incident-context";
import ResourceLink from "@/app/components/resource-link/resource-link";
import { Button, Modal } from "antd"
import {PlusOutlined} from "@ant-design/icons";
import {uuidv4} from "lib0/random";

let initialDefault = {
    affectedSystems: [],
    summary: {
        _isNew: true,
        impact: "",
        whenUtcString: "Thu, 01 Jan 1970 00:00:00 GMT",
        what: "",
        where: "",
        status: "Investigating",
        resourceLinks:[]
    }
};
const defaultIncident =  {
        affectedSystems: [
        {
            id: 'system_1',
            what: 'This is the first affected system',
            status: 'Active',
            actions: [
                {
                    id: 'action_1',
                    what: 'Some action here',
                    status: 'Active',
                    isMitigating: false,
                    timerDurationInMinutes: 5,
                    who: 'Gabe',
                    link: 'https://example.com',
                },
                {
                    id: 'action_2',
                    what: 'Yet another action description a bit longer',
                    status: 'Active',
                    isMitigating: true,
                    timerDurationInMinutes: 7,
                    who: 'Bjorn',
                },
                {
                    id: 'action_3',
                    what: 'And one more thing',
                    status: 'Failure',
                    isMitigating: false,
                    timerDurationInMinutes: 10,
                    who: 'Gabe',
                },
            ]
        },
        {
            id: 'system_2',
            what: 'Here is another issue',
            status: 'Active',
            actions: [
                {
                    id: 'action_4',
                    what: 'Do something important',
                    status: 'Active',
                    isMitigating: false,
                    who: 'Bjorn',
                }
            ]
        },
        {
            id: 'system_3',
            what: 'This one is fixed',
            status: 'Resolved',
            actions: [
                {
                    id: 'action_5',
                    what: 'We tried doing something and it worked',
                    status: 'Success',
                    isMitigating: true,
                    who: 'Gabe',
                }
            ]
        },

    ],
    summary: {
        impact: "10% order loss",
        whenUtcString: new Date(Date.parse('2023-02-20 11:22:33 GMT')).toUTCString(),
        what: "A big problem",
        where: "Some important thing",
        status: "Investigating",
        resourceLinks:[
            { id: 'link_1', name: 'Example link', url: 'https://example1.com'},
            { id: 'link_2', name: 'Another link', url: 'https://example2.com'},
            { id: 'link_3', name: 'One more really long title link', url: 'https://example3.com'},
        ],
    }
}


// Multiplayer Stuff ===================

function setupMultiplayer(dispatch: any) {
    // If we don't have a room and password, create them and refresh window so they're on the query string
    const params = new URLSearchParams(window.location.search)
    if (!params.get('room')) {
        params.set('room', new Date().valueOf().toString())
    }
    if (!params.get('password')) {
        params.set('password', parseInt((Math.random() * 10e5).toString(), 10).toString())
    }
    if ((new URLSearchParams(window.location.search)).toString() !== params.toString()) {
        window.location.search = params.toString()
    }

    const ydoc = new Y.Doc()
    const room = params.get('room') as string
    const websocketProvider = new WebsocketProvider(process.env.NEXT_PUBLIC_YJS_SOCKET_SERVER as string, room, ydoc)
    websocketProvider.on('status', (event: any) => {
        console.log('YJS WebSocket Provider: ', event.status) // logs "connected" or "disconnected"
    })
    // TODO: If we can't connect to the socket server, show an error dialog for now I guess?

    // Multi-user collab events with YJS
    const ydocEvents = ydoc.get('events', Y.Array)

    ydocEvents.observe(yjsChangeEvent => {
        yjsChangeEvent.changes.delta.forEach((change: any) => {
            if (!change.insert) return // we only expect `insert` changes because we are only ever pushing new events into the array in append only fashion
            change.insert.forEach((inserted: any) => {
                // console.log('YJS', inserted)
                dispatch(inserted)
            })
        })
    })

    return ydocEvents
}

const singleplayerDispatch = (dispatch: any, events: any[]) => {
    // console.log('sp dispatch', events)
    events.forEach(event => dispatch(event))
}

const multiplayerDispatch = (ydocEvents: any, events: any[] = []) => {
    // console.log('mp dispatch', events)
    if (!ydocEvents) return
    ydocEvents.push(events)
}
// End Multiplayer Stuff ===================


export default function OngoingIncident() {
    const [incident, dispatch] = useReducer(incidentReducer, initialDefault)
    let isMultiplayer = false
    const [dispatcher, setDispatcher] = useState({} as any) // TODO: hack, fix this?

    // Setup Single or Multiplayer Dispatching
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('disableMultiplayer')) {
            isMultiplayer = false
            setDispatcher(()=>{return singleplayerDispatch.bind(null, dispatch)})
        } else {
            isMultiplayer = true
            let ydocEvents = setupMultiplayer(dispatch)
            setDispatcher(()=>{return multiplayerDispatch.bind(null, ydocEvents)})
        }
        if (Notification.permission == 'granted') {
            Notification.requestPermission().then((newPermission)=>{
                setNotificationPermission(newPermission == 'granted')
            });
        }
    }, [])

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: incident
    })

    const [notificationPermission, setNotificationPermission] = useState(false)
    const toggleNotifications = (event: any) => {
        if (!notificationPermission) {
            setNotificationPermission(false)
        }
        else {
            Notification.requestPermission().then((newPermission)=>{
                setNotificationPermission(newPermission == 'granted')
            });
        }
    }
    const [affectedSystemFormVisible, setAffectedSystemFormVisible] = useState(false)
    const addAffectedSystemClick = () => {
        setAffectedSystemFormVisible(true)
    }
    const onAffectedSystemFormCancel = () => {
        setAffectedSystemFormVisible(false)
    }
    const addAffectedSystem = (affectedSystem: AffectedSystem) => {
        dispatcher([{type: 'add_affected_system', payload: {...affectedSystem, id: `system_${uuidv4()}`}}])
        setAffectedSystemFormVisible(false)
    }

    return (
        <NotificationsContext.Provider value={notificationPermission}>
        <IncidentDispatchContext.Provider value={dispatcher}>
            {/*<button id="debug-create-incident">DEBUG: Create Incident</button>*/}

            <header>
                <h1>Current Incident</h1>
                <Button onClick={toggleNotifications}>
                    {
                        notificationPermission
                            ? 'Disable Notifications'
                            : 'Enable Notifications'
                    }
                </Button>
            </header>

            <div className="mt-2">
                <IncidentSummary incident={incident} showForm={incident.summary._isNew}></IncidentSummary>
            </div>

            <section className="mt-8" data-test="affected-systems__listing__active">
                <h3>Ongoing Issues</h3>

                <section className="affected-systems__new">
                    {
                        <Modal
                            title="Add Affected System"
                            open={affectedSystemFormVisible}
                            onCancel={onAffectedSystemFormCancel}
                            footer={null}
                        >
                            <AffectedSystemForm
                                affectedSystem={null}
                                onSubmit={addAffectedSystem}
                                onCancel={onAffectedSystemFormCancel}
                            />
                        </Modal>
                    }
                    {
                        ! affectedSystemFormVisible &&
                        <Button data-test="btn-add-affected-system" size="small" icon={<PlusOutlined/>} onClick={addAffectedSystemClick}>Add Affected System</Button>
                    }
                </section>

                <ul className="grid grid-cols-3 gap-4">
                    {
                        incident.affectedSystems.filter(s => s.status == 'Active').map(s => {
                            return <li key={s.id}>
                                <AffectedSystem affectedSystem={s} />
                            </li>
                        })
                    }
                </ul>
            </section>

            <section className="mt-8" data-test="affected-systems__listing__past">
                <h3>Resolved Issues</h3>

                <ul className="grid grid-cols-3 gap-4">
                    {
                        incident.affectedSystems.filter(s => s.status == 'Resolved').map(s => {
                            return <li key={s.id}>
                                <AffectedSystem affectedSystem={s} />
                            </li>
                        })
                    }
                </ul>
            </section>
        </IncidentDispatchContext.Provider>
        </NotificationsContext.Provider>
    )
}
