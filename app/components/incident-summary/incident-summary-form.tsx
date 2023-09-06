'use client'

import {useForm} from "react-hook-form";
import {Button, DatePicker, Select, Switch} from "antd";
import * as dayjs from 'dayjs'
import {useEffect, useState} from "react";
import config from '../../config'

interface Props {
    summary?: IncidentSummary,
    onSubmit?: (summary: any) => void, //TODO: fix this type signature
    onCancel?: () => void,
}

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)


export default function IncidentSummaryForm(props : Props) {
    const {  summary, onSubmit, onCancel } = props
    const [whenDate, setWhenDate] = useState(summary?.whenUtcString)
    const [status, setStatus] = useState(summary?.status)

    const { register, handleSubmit, reset, formState: { errors }, setFocus } = useForm({
        defaultValues: { ...summary, whenDate, addDefaultActions: true },
        values: { status, whenDate }
    })

    useEffect(()=>{
        // HACK
        if (summary?.whenUtcString == "Thu, 01 Jan 1970 00:00:00 GMT") {
            setWhenDate(new Date().toUTCString())
        }

        if (summary?.what == "")  {
            setFocus('what')
        }
    })

    const myOnSubmit = (data: any) => {
        const { status, what, where, impact } = data
        onSubmit && onSubmit({status, what, where, impact, whenUtcString: data.whenDate, addDefaultActions: data.addDefaultActions })
    }

    const handleStatusSelect = (data: any) => {
        setStatus(data)
    }

    return (
        <form
            onSubmit={handleSubmit((data) => myOnSubmit(data))}
            className="mt-2 mb-4"
        >
            <div className="flex flex-col mb-2">
                <label htmlFor="summaryStatus">Status</label>
                <Select
                    defaultValue={summary?.status}
                    // style={{ width: 120 }}
                    onChange={handleStatusSelect}
                    options={
                        config.statuses.map(s => { return { value: s, label: s } } )
                    }
                    data-test="summary__select__status"
                />
            </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhat">What is wrong?</label>
                    <input
                        type="text"
                        id="summaryWhat"
                        data-test="summary__input__what"
                        {...register("what")}
                    />
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhen">Since when?</label>
                    <input
                        type="text"
                        id="summaryWhen"
                        data-test="summary__input__when"
                        {...register("whenDate")}
                    />
                {/*<DatePicker*/}
                {/*    format="YYYY-MM-DD HH:mm"*/}
                {/*    // defaultValue={whenDate}*/}
                {/*    value={whenDate}*/}
                {/*    showTime={{ defaultValue:(whenDate) }}*/}
                {/*    onOk={(val)=>{setWhenDate(val)}}*/}
                {/*    changeOnBlur={true}*/}
                {/*/>*/}
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhere">Where is this happening?</label>
                    <input
                        type="text"
                        id="summaryWhere"
                        data-test="summary__input__where"
                        {...register("where")}
                    />
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhat">What is the impact?</label>
                    <input
                        type="text"
                        id="summaryImpact"
                        data-test="summary__input__impact"
                        {...register("impact")}
                    />
                </div>

            <div>
                <label htmlFor="summaryAddDefaultActions">Add default actions?</label>
                <input
                    className="ml-2"
                    type="checkbox"
                    id="summaryAddDefaultActions"
                    data-test="summary__add-default-actions"
                    {...register("addDefaultActions")}
                />
            </div>

            <Button
                size="small"
                type="primary"
                htmlType="submit"
                data-test="summary__submit"
            >
                { summary?._isNew ? 'Create' : 'Update' }
            </Button>

            <Button
                type="default"
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
