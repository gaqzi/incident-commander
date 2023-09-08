'use client'

import {createContext} from "react";

export const nullDispatch = (events: any[]) => {
    console.log('NULL DISPATCH', events)
}


export const IncidentDispatchContext = createContext(nullDispatch)
export const NotificationsContext = createContext(false)
