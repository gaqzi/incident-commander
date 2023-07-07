'use client'

import {useForm} from "react-hook-form";
import {Button, DatePicker} from "antd";
import * as dayjs from 'dayjs'
import {useEffect, useState} from "react";

interface props {
    summary?: IncidentSummary,
    onSubmit?: (Action) => void,
    onCancel?: () => void,
    affectedSystemId?: string,
}

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)


export default function IncidentSummaryForm({ summary, onSubmit, onCancel, affectedSystemId} : props) {
    const [whenDate, setWhenDate] = useState(dayjs.utc(Date.parse(summary.whenUtcString)))

    const { register, handleSubmit, reset, formState: { errors }, setFocus } = useForm({
        defaultValues: { ...summary, whenDate }
    })

    useEffect(()=>{
        if (summary.what == "")  {
            setFocus('what')
        }
    }, [setFocus, summary.what])



    const myOnSubmit = (data) => {
        const utcString = whenDate.toDate().toUTCString()
        onSubmit && onSubmit({...data, whenUtcString: utcString})
    }

    return (
        <form
            onSubmit={handleSubmit((data) => myOnSubmit(data))}
            className="mt-2 mb-4"
        >
            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhat">What is wrong?</label>
                    <input
                        type="text"
                        id="summaryWhat"
                        name="what"
                        data-test="summary__what"
                        {...register("what")}
                    />
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhat">Since when?</label>
                <DatePicker
                    format="YYYY-MM-DD HH:mm"
                    defaultValue={whenDate}
                    showTime={{ defaultValue:(whenDate) }}
                    onOk={(val)=>{setWhenDate(val)}}
                    data-test="summary__when"
                />
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhere">Where is this happening?</label>
                    <input
                        type="text"
                        id="summaryWhere"
                        name="where"
                        data-test="summary__where"
                        {...register("where")}
                    />
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhat">What is the impact?</label>
                    <input
                        type="text"
                        id="summaryImpact"
                        name="impact"
                        data-test="summary__impact"
                        {...register("impact")}
                    />
                </div>

            <Button
                size="small"
                type="primary"
                htmlType="submit"
                data-test="summary__submit"
            >
                Update
            </Button>

            <Button
                type="secondary"
                size="small"
                htmlType="reset"
                className="cancel"
                data-test="summary__cancel"
                onClick={onCancel}
            >
                Cancel
            </Button>
        </form>
    )
}