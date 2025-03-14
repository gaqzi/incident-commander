'use client'

import { useState, useEffect } from 'react'
import { Form, Input, Button, Modal } from 'antd'
import { UserInfo, useUserContext } from '@/app/contexts/user-context'

interface UserFormProps {
  isVisible: boolean
  onClose: () => void
  initialValues?: UserInfo
  isEditing?: boolean
}

export default function UserForm({ 
  isVisible, 
  onClose, 
  initialValues = { name: '', team: '' },
  isEditing = false
}: UserFormProps) {
  const [form] = Form.useForm()
  const { setUserInfo } = useUserContext()
  
  useEffect(() => {
    if (isVisible && initialValues) {
      form.setFieldsValue(initialValues)
    }
  }, [form, initialValues, isVisible])

  const handleSubmit = (values: UserInfo) => {
    setUserInfo(values)
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={isEditing ? "Edit Your Information" : "Enter Your Information"}
      open={isVisible}
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          name="name"
          label="Your Name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input placeholder="Enter your name" />
        </Form.Item>
        
        <Form.Item
          name="team"
          label="Your Team"
          rules={[{ required: true, message: 'Please enter your team' }]}
        >
          <Input placeholder="Enter your team" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            {isEditing ? "Update" : "Save"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
