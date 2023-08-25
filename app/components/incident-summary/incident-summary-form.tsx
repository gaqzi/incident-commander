'use client'

import {useForm} from "react-hook-form";
import {Button, DatePicker, Switch} from "antd";
import * as dayjs from 'dayjs'
import {useEffect, useState} from "react";

interface Props {
    summary?: IncidentSummary,
    onSubmit?: (Action) => void,
    onCancel?: () => void,
}

const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)


export default function IncidentSummaryForm(props : Props) {
    const {  summary, onSubmit, onCancel } = props
    const [whenDate, setWhenDate] = useState(summary.whenUtcString)

    const { register, handleSubmit, reset, formState: { errors }, setFocus } = useForm({
        defaultValues: { ...summary, whenDate, addDefaultActions: true },
        values: { whenDate }
    })

    useEffect(()=>{
        // HACK
        if (summary.whenUtcString == "Thu, 01 Jan 1970 00:00:00 GMT") {
            setWhenDate(new Date().toUTCString())
        }

        if (summary.what == "")  {
            setFocus('what')
        }
    })

    const myOnSubmit = (data) => {
        const { what, where, impact } = data
        onSubmit && onSubmit({what, where, impact, whenUtcString: data.whenDate, addDefaultActions: data.addDefaultActions })
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
                        data-test="summary__input__what"
                        {...register("what")}
                    />
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhen">Since when?</label>
                    <input
                        type="text"
                        id="summaryWhen"
                        name="whenDate"
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
                        name="where"
                        data-test="summary__input__where"
                        {...register("where")}
                    />
                </div>

            <div className="flex flex-col mb-2">
                    <label htmlFor="summaryWhat">What is the impact?</label>
                    <input
                        type="text"
                        id="summaryImpact"
                        name="impact"
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
                    name="addDefaultActions"
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
                { summary._isNew ? 'Create' : 'Update' }
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
