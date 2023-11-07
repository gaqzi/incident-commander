import { Button, Popover } from "antd";
import { DeleteOutlined, EditOutlined, } from "@ant-design/icons";
import { useContext, useState } from "react";
import { IncidentDispatchContext } from "@/app/contexts/incident-context";
import TimelineEntryForm from "@/app/components/timeline-entry/timeline-entry-form";


const timelineTimestampClasses = "text-xs  font-light"


export default function TimelineEntry ({i}: {i: TimelineItem}) {
    const incidentReducer = useContext(IncidentDispatchContext)
    const [showForm, setShowForm] = useState(false)

    const updateTimelineEntry = (data: TimelineItem) => {
        setShowForm(false)
        incidentReducer([{type: 'edit_action_timeline_item', payload: data}])
    }

    const cancelForm = () => {
        setShowForm(false)
    }

    return (
    <>
        { showForm && <div className=""><TimelineEntryForm timelineItem={i} onSubmit={updateTimelineEntry} onCancel={cancelForm} /></div> }

        { !showForm &&
            <Popover 
                placement="right"
                content={
                <>
                    <Button 
                    className="block mb-1" 
                    type="link"
                    size="middle"
                    icon={<EditOutlined/>} 
                    onClick={ () => setShowForm(true) }
                    data-test="action__edit"
                    >
                        Edit Entry
                    </Button>
                    <Button 
                    className="block mb-1" 
                    type="link"
                    size="middle"
                    icon={<DeleteOutlined/>} 
                    onClick={ () => incidentReducer([{type: 'remove_action_timeline_item', payload: i.id}]) }
                    data-test="action__edit"
                    >
                        Delete Entry
                    </Button>
                </>
                } 
            >
                {i.text}<br/>
                <span className={timelineTimestampClasses}>{i.timestampUtc}</span>
            </Popover>
        }
    </>
    )
  }