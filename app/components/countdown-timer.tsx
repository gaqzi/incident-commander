'use client'

import {useContext, useEffect, useState} from "react";
import {Button, Popover} from "antd";
import {useForm} from "react-hook-form";
import { IncidentDispatchContext } from "../contexts/incident-context";

interface Props {
    id: string
    action: Action
    onEditClick: () => void
    onCompleted?: (id: string, message?: string) => void
    label?: string
}
export default function CountdownTimer({id, action, label, onEditClick, onCompleted}: Props) {
    let timer: any
    const incidentReducer = useContext(IncidentDispatchContext)
    const [expiresAt, setExpiresAt] = useState((new Date(Date.parse(action.timer!.startedAtUtc))).valueOf())
    const [durationMins, setDurationMins] = useState(action.timerDurationInMinutes)
    const [minutes, setMinutes] = useState(0)
    const [seconds, setSeconds] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { durationMins: action.timer!.durationInMinutes }
    })

    const onSubmit = (data: {durationMins: number}) => {
        setDurationMins(data.durationMins)
        setShowForm(false)
        restart(durationMins)
    }

    const restart = (newDurationMins?: number) => {
        action.timer = {
            ...action.timer!, 
            startedAtUtc: new Date(Date.now()).toUTCString(), 
            isRunning: true,
        }
        if (newDurationMins) {
            action.timer.durationInMinutes = newDurationMins
        }
        incidentReducer([{type: 'edit_action', payload: {...action}}])
    }

    const cancel = () => {
        action.timer = {
            ...action.timer!, 
            durationInMinutes: 0,
            isRunning: false
        }
        incidentReducer([{type: 'edit_action', payload: {...action}}])
    }

    const updateMinsSecs = (expiresAtMs: number) => {
        timer = !timer && setInterval(() => {
            let timeLeft = Math.max(0, Number(((expiresAtMs - Date.now()) / 1000).toFixed()))
            const seconds = timeLeft % 60
            const minutes = (timeLeft - seconds) / 60
            setMinutes(minutes)
            setSeconds(seconds)

            if (minutes == 0 && seconds == 0) {
                onCompleted && onCompleted(id, label)
                clearInterval(timer)
            }
        }, 1000)
    }

    useEffect(() => {
        if (action.timer && !action.timer.isRunning) {
            const seconds = 0
            const minutes = 0
            setMinutes(minutes)
            setSeconds(seconds)
            clearInterval(timer)
        }
        else {
            const expiresAtMs = new Date(Date.parse(action.timer!.startedAtUtc)).valueOf() + action.timer!.durationInMinutes * 60 * 1000
            updateMinsSecs(expiresAtMs)
        }
        return () => { clearInterval(timer) }
    }, [action.timer])

    return (
    <div data-test="countdown-display-wrapper">
        {
            showForm &&
              <form onSubmit={handleSubmit((data) => {reset(); onSubmit(data)})} >
                <div className="flex flex-col mb-2">
                  <label className="block" htmlFor="minutes">Minutes:</label>
                  <input
                    className="block"
                    type="text"
                    id="minutes"
                    data-test="countdown-timer__minutes"
                    {...register("durationMins")}
                  />
                </div>

                <Button
                  size="small"
                  type="primary"
                  htmlType="submit"
                  data-test="countdown-timer-form__submit"
                >
                  Update
                </Button>

                <Button
                  size="small"
                  htmlType="reset"
                  className="cancel"
                  data-test="countdown-timer-form__cancel"
                  onClick={()=>{ reset(); setShowForm(false)} }
                >
                  Cancel
                </Button>
              </form>
    }

    <Popover content={
        <>
            <Button data-test="countdown-timer__restart" size="small" onClick={()=>restart()}>Restart</Button>
            {
                action.timer!.isRunning && <Button data-test="countdown-timer__cancel" size="small" onClick={cancel}>Cancel</Button>
            }
            <Button data-test="countdown-timer__edit" size="small" onClick={onEditClick}>Edit</Button>
        </>
    }>
        {
          !showForm &&
          <span data-test="countdown-display">
            <span className="minutes">{minutes}</span>m
            <span className="seconds">{seconds}</span>s
        </span>
        }
    </Popover>
    </div>
    )
}