'use client'

import {useEffect, useReducer, useState} from 'react'
import {useForm} from 'react-hook-form'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import {incidentReducer} from "@/app/components/ongoing-incident/reducer";
import IncidentSummary from "@/app/components/incident-summary/incident-summary";
import AffectedSystem from "@/app/components/affected-system/affected-system";
import AffectedSystemForm from "@/app/components/affected-system/affected-system-form";
import {NotificationsContext, IncidentDispatchContext, nullDispatch, YDocContext, YDocMultiplayerProviderContext } from "@/app/contexts/incident-context";
import ResourceLink from "@/app/components/resource-link/resource-link";
import { Button, Modal } from "antd"
import {PlusOutlined} from "@ant-design/icons";
import {uuidv4} from "lib0/random";

const ydoc = new Y.Doc()



// Multiplayer Stuff ===================

function setupMultiplayer(dispatch: any, setYdocProvider: any) {
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

    const websocket_host = params.get('yjs_socket_host') || process.env.NEXT_PUBLIC_YJS_SOCKET_SERVER
    const room = params.get('room') as string

    // const ydoc = new Y.Doc()

    // We persist the document content across sessions
    const indexeddbProvider = new IndexeddbPersistence(room, ydoc)
    // indexeddbProvider.on('synced', () => {
    //     console.log('content from the database is loaded')
    // })
    // TODO: what if we can't store to localstorage? Should we throw a warning, error?

    const websocketProvider = new WebsocketProvider(websocket_host as string, room, ydoc)
    setYdocProvider(websocketProvider)
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
    const params = new URLSearchParams(window.location.search)
    
    const initialDefault = {
        affectedSystems: [],
        id: params.get('room'),
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


    const [incident, dispatch] = useReducer(incidentReducer, initialDefault)
    let isMultiplayer = false
    const [dispatcher, setDispatcher] = useState({} as any) // TODO: hack, fix this?
    const [supportsNotifications, setSupportsNotifications] = useState(false)
    const [ydocProvider, setYdocProvider] = useState({} as WebsocketProvider)

    // Setup Single or Multiplayer Dispatching
    useEffect(() => {
        setSupportsNotifications(typeof Notification !== 'undefined') // useEffect only runs client-side. We'll use this to conditionally render Notification button section.

        const params = new URLSearchParams(window.location.search)
        if (params.get('disableMultiplayer')) {
            isMultiplayer = false
            setDispatcher(()=>{return singleplayerDispatch.bind(null, dispatch)})
        } else {
            isMultiplayer = true
            let ydocEvents = setupMultiplayer(dispatch, setYdocProvider)
            setDispatcher(()=>{return multiplayerDispatch.bind(null, ydocEvents)})
        }
        if (typeof Notification !== 'undefined' && Notification.permission == 'granted') {
            Notification.requestPermission().then((newPermission)=>{
                setNotificationPermission(newPermission == 'granted')
            });
        }
    }, [])

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: incident
    })

    const [notificationPermission, setNotificationPermission] = useState(false)
    useEffect(() => {
        setNotificationPermission(typeof Notification !== 'undefined' && Notification.permission == 'granted')
    }, [])
    const toggleNotifications = (event: any) => {
        if (notificationPermission) {
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
        <YDocContext.Provider value={ydoc}>
        <YDocMultiplayerProviderContext.Provider value={ydocProvider}>
            {/*<button id="debug-create-incident">DEBUG: Create Incident</button>*/}

            { 
                supportsNotifications &&
                <header>
                    <Button onClick={toggleNotifications}>
                        {
                            notificationPermission
                                ? 'Disable Notifications'
                                : 'Enable Notifications'
                        }
                    </Button>
                </header>
            }

            <div className="mt-2">
                <IncidentSummary incident={incident} showForm={incident.summary._isNew}></IncidentSummary>
            </div>

            
            {
                ! incident.summary._isNew &&
                <>
                    <section className="mt-8" data-test="affected-systems__listing__active">
                        <h3 className="mb-2">Ongoing Issues

                        {
                            ! affectedSystemFormVisible &&
                            <Button data-test="btn-add-affected-system" type="text" size="small" icon={<PlusOutlined/>} onClick={addAffectedSystemClick}>Add Issue</Button>
                        }
                        </h3>

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

                    { 
                        incident.affectedSystems.filter(s => s.status == 'Resolved').length > 0 
                        &&
                        <section className="mt-8 border-t-2 border-dotted border-slate-200" data-test="affected-systems__listing__past">
                            <h3 className="mt-4 mb-2">Resolved Issues</h3>

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
                    }
                    </>
            }
        </YDocMultiplayerProviderContext.Provider>
        </YDocContext.Provider>
        </IncidentDispatchContext.Provider>
        </NotificationsContext.Provider>
    )
}
