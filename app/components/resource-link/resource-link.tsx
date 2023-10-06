'use client'

import ActionForm from "@/app/components/action/action-form";
import {useContext, useState} from "react";
import {IncidentDispatchContext } from "@/app/contexts/incident-context";
import CountdownTimer from "@/app/components/countdown-timer";
import ResourceLinkForm from "@/app/components/resource-link/resource-link-form";
import {Popover, Button, Modal} from "antd"
import {EditOutlined} from "@ant-design/icons";

interface props {
    resourceLink: ResourceLink
}

export default function ResourceLink({resourceLink: resourceLink}: props) {
    const [showForm, setShowForm] = useState(false)
    const incidentReducer = useContext(IncidentDispatchContext)
    const updateResourceLink = (data: any) => {
        setShowForm(false)
        incidentReducer([{type: 'edit_incident_resource_link', payload: data}])
    }
    const cancelForm = () => {
        setShowForm(false)
    }
    const onEditClick = () => {
        setShowForm(true)
    }

    return (
        <>
              <Modal
                title="Edit Resource Link"
                open={showForm}
                onCancel={cancelForm}
                footer={null}
              >
                  <ResourceLinkForm resourceLink={resourceLink} onSubmit={updateResourceLink} onCancel={cancelForm}/>
              </Modal>

            {!showForm &&
              <div>
                <Popover content={<Button data-test="button-edit-resource" type="text" icon={<EditOutlined />} onClick={onEditClick}>Edit</Button>} title="Actions">
                  <a target="_blank" href={resourceLink.url}>{resourceLink.name}</a>
                </Popover>
              </div>
            }
        </>
    )
}