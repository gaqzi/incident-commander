import AffectedSystem from "@/app/components/affected-system/affected-system";
import {useForm} from "react-hook-form";
import {Button} from "antd";
import {useEffect} from "react";

interface props {
    affectedSystem?: AffectedSystem | null,
    onSubmit?: (affectedSystem: AffectedSystem) => void,
    onCancel?: () => void,
}

export default function AffectedSystemForm( { affectedSystem, onSubmit, onCancel }: props ) {
    const { register, handleSubmit, reset, formState: { errors }, setFocus } = useForm({
        defaultValues: ({...affectedSystem, addDefaultActions: true }  || { addDefaultActions: true })
    })

    const myOnSubmit = (data: any) => {
        reset()
        onSubmit && onSubmit(data)
    }

    useEffect(() => {
        setFocus("what")
    }) // TODO BUG: make this work on subsequent shows...

    return (
        <form
            onSubmit={handleSubmit(myOnSubmit)}
            className="mb-4"
        >
            <div className="flex flex-col mb-2">
                <label>What is not working?</label>
                <input
                    className="block"
                    type="text"
                    placeholder="Payment redirections"
                    data-test="new-affected-system__what"
                    autoFocus
                    {...register("what")}
                />
            </div>

            { 
                ! affectedSystem?.id &&
                <div>
                    <label htmlFor="summaryAddDefaultActions">Add default actions?</label>
                    <input
                        className="ml-2 inline"
                        type="checkbox"
                        data-test="new-affected-system__add-default-actions"
                        {...register("addDefaultActions")}
                    />
                </div>
            }


            <div className="mt-1">
                <Button
                    type="primary"
                    size="small"
                    htmlType="submit"
                    className="mr-1"
                    data-test="new-affected-system__submit"
                >
                    { affectedSystem?.id ? 'Update' : 'Add' }
                </Button>

                <Button
                    size="small"
                    htmlType="reset"
                    data-test="new-affected-system__cancel"
                    onClick={onCancel}
                >
                    Cancel
                </Button>

            </div>
        </form>
    )
}