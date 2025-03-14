'use client'

import { useEffect, useState } from 'react'
import { Button, Card, List, Typography, Avatar, Tooltip } from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { useUserContext, UserInfo } from '@/app/contexts/user-context'
import UserForm from './user-form'
import { useContext } from 'react'
import { YDocMultiplayerProviderContext } from '@/app/contexts/incident-context'

const { Title, Text } = Typography

interface ConnectedUser extends UserInfo {
  clientId: number
  isCurrentUser: boolean
}

interface CurrentUsersProps {
  multiplayerStatus?: string
}

export default function CurrentUsers({ multiplayerStatus = 'disconnected' }: CurrentUsersProps) {
  const { userInfo, isUserInfoSet } = useUserContext()
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [isUserFormVisible, setIsUserFormVisible] = useState<boolean>(false)
  const ydocProvider = useContext(YDocMultiplayerProviderContext)

  // Show user form if user info is not set and multiplayer is connected
  useEffect(() => {
    if (!isUserInfoSet && multiplayerStatus === 'connected') {
      setIsUserFormVisible(true)
    }
  }, [isUserInfoSet, multiplayerStatus])

  // Update connected users when awareness changes
  useEffect(() => {
    if (!ydocProvider || !ydocProvider.awareness || multiplayerStatus !== 'connected') return

    const updateConnectedUsers = () => {
      if (!userInfo) return

      const awarenessStates = ydocProvider.awareness.getStates()
      const users: ConnectedUser[] = []
      
      // Get current client ID
      const currentClientId = ydocProvider.awareness.clientID

      // Convert awareness states to user list
      awarenessStates.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            ...state.user,
            clientId,
            isCurrentUser: clientId === currentClientId
          })
        }
      })

      // Sort users - current user first, then alphabetically by name
      users.sort((a, b) => {
        if (a.isCurrentUser) return -1
        if (b.isCurrentUser) return 1
        return a.name.localeCompare(b.name)
      })

      setConnectedUsers(users)
    }

    // Update awareness with current user info
    if (userInfo) {
      ydocProvider.awareness.setLocalState({
        user: userInfo
      })
    }

    // Listen for awareness changes
    ydocProvider.awareness.on('change', updateConnectedUsers)
    
    // Initial update
    updateConnectedUsers()

    // Cleanup
    return () => {
      ydocProvider.awareness.off('change', updateConnectedUsers)
    }
  }, [ydocProvider, userInfo, multiplayerStatus])

  const handleEditUser = () => {
    setIsUserFormVisible(true)
  }

  const handleCloseUserForm = () => {
    setIsUserFormVisible(false)
  }

  // Don't render anything if multiplayer is not connected
  if (multiplayerStatus !== 'connected') {
    return null
  }

  return (
    <div className="current-users">
      <Card 
        title={<Title level={5}>Current Users</Title>}
        extra={
          <Tooltip title="Edit your information">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={handleEditUser}
              aria-label="Edit your information"
            />
          </Tooltip>
        }
        size="small"
      >
        <List
          dataSource={connectedUsers}
          renderItem={(user) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: user.isCurrentUser ? '#1890ff' : '#d9d9d9' }}
                  />
                }
                title={
                  <div>
                    {user.name} {user.isCurrentUser && <Text type="secondary">(You)</Text>}
                  </div>
                }
                description={<Text type="secondary">{user.team}</Text>}
              />
            </List.Item>
          )}
          locale={{ emptyText: "No users connected" }}
        />
      </Card>

      <UserForm 
        isVisible={isUserFormVisible} 
        onClose={handleCloseUserForm}
        initialValues={userInfo || undefined}
        isEditing={isUserInfoSet}
      />
    </div>
  )
}
