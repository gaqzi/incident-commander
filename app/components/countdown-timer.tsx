'use client'

import {useEffect, useState} from "react";
import {Button, Popover} from "antd";
import {useForm} from "react-hook-form";

interface Props {
    id: string
    durationInMinutes: number
    onCompleted?: (id, string?) => void
    label?: string
}
export default function CountdownTimer({id, durationInMinutes, label, onCompleted}: Props) {
    let timer
    const [expiresAt, setExpiresAt] = useState((new Date(Date.now() + 1000 * 60 * durationInMinutes)).valueOf())
    const [durationMins, setDurationMins] = useState(durationInMinutes)
    const [minutes, setMinutes] = useState(0)
    const [seconds, setSeconds] = useState(0)
    const [isRunning, setIsRunning] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { durationMins: durationInMinutes }
    })

    const onSubmit = (data) => {
        setDurationMins(data.durationMins)
        setShowForm(false)
        restart(null, data.durationMins)
    }

    const restart = (event, mins) => {
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
    <>
        {
            showForm &&
              <form onSubmit={handleSubmit((data) => {reset(); onSubmit(data)})} >
                <div className="flex flex-col mb-2">
                  <label className="block" htmlFor="minutes">Minutes:</label>
                  <input
                    className="block"
                    type="text"
                    id="minutes"
                    name="durationMins"
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
            <Button size="small" onClick={restart}>Restart</Button>
            {
                isRunning && <Button size="small" onClick={cancel}>Cancel</Button>
            }
            <Button size="small" onClick={()=>setShowForm(true)}>Edit</Button>
        </>
    }>
        {
          !showForm &&
          <span>
            -
            <span className="minutes">{minutes}</span>
            :
            <span className="seconds">{seconds}</span>
        </span>
        }
    </Popover>
    </>
    )
}