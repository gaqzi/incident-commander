import AffectedSystem from "@/app/components/affected-system/affected-system";
import {useForm} from "react-hook-form";
import {Button} from "antd";
import {useEffect} from "react";

interface props {
    affectedSystem?: AffectedSystem,
    onSubmit?: (AffectedSystem) => void,
    onCancel?: () => void,
}

export default function AffectedSystemForm( { affectedSystem, onSubmit, onCancel }: props ) {
    const { register, handleSubmit, reset, formState: { errors }, setFocus } = useForm({
        defaultValues: affectedSystem
    })

    const myOnSubmit = (data) => {
        reset()
        onSubmit && onSubmit(data)
    }

    useEffect(() => {
        setFocus("what")
    }) // TODO BUG: make this work on subsequent shows...

    return (
        <form
            onSubmit={handleSubmit(myOnSubmit)}
        >
            <div>
                <label>What is not working?</label>
            </div>
            <div>
                <input
                    type="text"
                    name="what"
                    placeholder="Payment redirections"
                    data-test="new-affected-system__what"
                    autoFocus
                    {...register("what")}
                />
            </div>

            <div className="flex flex-col mb-2">
                <label htmlFor="summaryWhat">TODO - Add Use Default Actions</label>
            </div>


            <div>
                <Button
                    type="primary"
                    size="small"
                    htmlType="submit"
                    data-test="new-affected-system__submit"
                >
                    Add!
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