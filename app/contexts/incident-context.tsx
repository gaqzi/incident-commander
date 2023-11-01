'use client'

import * as Y from 'yjs'

import {createContext} from "react";
import { WebsocketProvider } from 'y-websocket';

export const nullDispatch = (events: any[]) => {
    console.log('NULL DISPATCH', events)
}


export const IncidentDispatchContext = createContext(nullDispatch)
export const NotificationsContext = createContext(false)
export const YDocContext = createContext(new Y.Doc())
export const YDocMultiplayerProviderContext = createContext({} as WebsocketProvider)
