'use client'

import {useForm} from "react-hook-form";
import {Button} from "antd";

interface props {
    action?: Action | any // TODO: fix this
    onSubmit?: (action: Action) => void,
    onCancel?: () => void,
}

export default function ActionForm({ action, onSubmit, onCancel } : props) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: action
    })

    return (
        <form
            onSubmit={handleSubmit((data) => {reset(); onSubmit && onSubmit(data)})}
        >
            <div className="flex flex-col mb-2">
                <label className="block" htmlFor="newActionWhat">What are we trying?</label>
                <input
                    className="block"
                    type="text"
                    id="newActionWhat"
                    data-test="new-action__what"
                    {...register("what")}
                />
            </div>

                <div className="flex flex-col mb-2">
                    <label className="block" htmlFor="newActionWho">Who is doing it?</label>
                    <input
                        className="block"
                        type="text"
                        id="newActionWho"
                        data-test="new-action__who"
                        {...register("who")}
                    />
                </div>

                <div className="flex flex-col mb-2">
                    <label className="block" htmlFor="newActionLink">Do you have a link for more information?</label>
                    <input
                        className="block"
                        type="url"
                        id="newActionLink"
                        placeholder="https://company.slack.com/archive/…"
                        data-test="new-action__link"
                        {...register("link")}
                    />
                </div>

                <div className="flex flex-col mb-2">
                    <label className="block"  htmlFor="newActionWhen">Minutes between updates?</label>
                    <input
                        className="block"
                        type="text"
                        id="newActionWhen"
                        data-test="new-action__minutes-between-updates"
                        {...register("timerDurationInMinutes")}
                    />
                </div>

                <div className="flex flex-col mb-2">
                    <label>
                        Is mitigating?
                        <input
                            type="checkbox"
                            data-test="new-action__is-mitigating"
                            {...register("isMitigating")}
                        />
                    </label>
                </div>

            <input
                type="hidden"
                {...register("affectedSystemId")}
            />

            <Button
                size="small"
                type="primary"
                htmlType="submit"
                data-test="new-action__submit"
            >
                { action!.id ? 'Update' : 'Add'}
            </Button>

            <Button
                size="small"
                htmlType="reset"
                className="cancel"
                data-test="add_action__cancel"
                onClick={onCancel}
            >
                Cancel
            </Button>
        </form>
    )
}