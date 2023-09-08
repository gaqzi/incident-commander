'use client'

import {useEffect, useState} from "react";
import {Button, Popover} from "antd";
import {useForm} from "react-hook-form";

interface Props {
    id: string
    durationInMinutes: number
    onCompleted?: (id: string, message?: string) => void
    label?: string
}
export default function CountdownTimer({id, durationInMinutes, label, onCompleted}: Props) {
    let timer: any
    const [expiresAt, setExpiresAt] = useState((new Date(Date.now() + 1000 * 60 * durationInMinutes)).valueOf())
    const [durationMins, setDurationMins] = useState(durationInMinutes)
    const [minutes, setMinutes] = useState(0)
    const [seconds, setSeconds] = useState(0)
    const [isRunning, setIsRunning] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { durationMins: durationInMinutes }
    })

    const onSubmit = (data: {durationMins: number}) => {
        setDurationMins(data.durationMins)
        setShowForm(false)
        restart(data.durationMins)
    }

    const restart = (mins?: number) => {
        if (mins == null) {
            mins = durationMins
        }
        setExpiresAt((new Date(Date.now() + 1000 * 60 * mins)).valueOf())
        setIsRunning(true)
    }

    const cancel = () => {
        setIsRunning(false)
        setMinutes(0)
        setSeconds(0)
    }

    const updateMinsSecs = () => {
        timer = !timer && setInterval(() => {
            let timeLeft = Math.max(0, Number(((expiresAt - Date.now()) / 1000).toFixed()))
            const seconds = timeLeft % 60
            const minutes = (timeLeft - seconds) / 60
            setMinutes(minutes)
            setSeconds(seconds)

            if (minutes == 0 && seconds == 0) {
                onCompleted && onCompleted(id, label)
                setIsRunning(false)
            }
        }, 1000)
    }

    useEffect(() => {
        if (! isRunning) {
            clearInterval(timer)
        }
        else {
            updateMinsSecs()
        }
        return () => { clearInterval(timer) }
    }, [isRunning, expiresAt])

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
                isRunning && <Button data-test="countdown-timer__cancel" size="small" onClick={cancel}>Cancel</Button>
            }
            <Button data-test="countdown-timer__edit" size="small" onClick={()=>setShowForm(true)}>Edit</Button>
        </>
    }>
        {
          !showForm &&
          <span data-test="countdown-display">
            -
            <span className="minutes">{minutes}</span>
            :
            <span className="seconds">{seconds}</span>
        </span>
        }
    </Popover>
    </div>
    )
}