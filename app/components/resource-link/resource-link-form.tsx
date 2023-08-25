'use client'

import {useForm} from "react-hook-form";
import {Button} from "antd";

interface props {
    resourceLink?: ResourceLink
    onSubmit?: (ResourceLink) => void,
    onCancel?: () => void,
}

export default function ResourceLinkForm({ resourceLink, onSubmit, onCancel } : props) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { ...resourceLink }
    })

    return (
        <form
            onSubmit={handleSubmit((data) => onSubmit && onSubmit(data))}
        >
            <div className="flex flex-col mb-2">
                <label htmlFor="resourceLinkName">Resource Name</label>
                <input
                    type="text"
                    id="resourceLinkName"
                    name="name"
                    data-test="resource-link__name"
                    {...register("name")}
                />
            </div>

            <div className="flex flex-col mb-2">
                <label htmlFor="resourceLinkUrl">URL</label>
                <input
                    type="text"
                    id="resourceLinkUrl"
                    name="url"
                    data-test="resource-link__url"
                    {...register("url")}
                />
            </div>

            <input type="hidden" name="id" {...register("id")} />


            <div>
                <Button
                    className="inline"
                    type="primary"
                    size="small"
                    htmlType="submit"
                    data-test="resource-link__submit"
                >
                    Add
                </Button>

                <Button
                    className="inline"
                    type="secondary"
                    size="small"
                    htmlType="reset"
                    className="cancel"
                    data-test="resource-link__cancel"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}