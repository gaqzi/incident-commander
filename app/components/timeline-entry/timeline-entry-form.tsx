import {useForm} from "react-hook-form";
import {Button} from "antd";

interface props {
    timelineItem?: TimelineItem | any // TODO: fix this
    onSubmit?: (timelineItem: TimelineItem) => void,
    onCancel?: () => void,
}

export default function TimelineEntryForm({ timelineItem, onSubmit, onCancel } : props) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: timelineItem
    })

    return (
        <form
            onSubmit={handleSubmit((data) => {reset(); onSubmit && onSubmit(data)})}
        >
            <div className="flex flex-col mb-2">
                <label className="block" htmlFor="text">Text</label>
                <input
                    autoFocus
                    className="block"
                    type="text"
                    data-test="timeline-entry__text"
                    {...register("text")}
                />
            </div>

            <div className="flex flex-col mb-2">
                <label className="block" htmlFor="text">Timestamp UTC</label>
                <input
                    className="block"
                    type="text"
                    data-test="timeline-entry__text"
                    {...register("timestampUtc")}
                />
            </div>

            <Button
                size="small"
                type="primary"
                htmlType="submit"
                data-test="timeline-form__submit"
            >
                { timelineItem!.id ? 'Update' : 'Add'}
            </Button>

            <Button
                size="small"
                htmlType="reset"
                className="cancel"
                data-test="timeline-form__cancel"
                onClick={onCancel}
            >
                Cancel
            </Button>
        </form>
    )
}