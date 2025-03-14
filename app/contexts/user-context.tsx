'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Define the user information type
export interface UserInfo {
  name: string
  team: string
}

// Define the context type
interface UserContextType {
  userInfo: UserInfo | null
  setUserInfo: (userInfo: UserInfo) => void
  isUserInfoSet: boolean
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  userInfo: null,
  setUserInfo: () => {},
  isUserInfoSet: false
})

// Custom hook to use the user context
export const useUserContext = () => useContext(UserContext)

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null)
  const [isUserInfoSet, setIsUserInfoSet] = useState<boolean>(false)

  // Load user info from localStorage on component mount
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('incidentCommander_userInfo')
    if (storedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(storedUserInfo)
        setUserInfoState(parsedUserInfo)
        setIsUserInfoSet(true)
      } catch (error) {
        console.error('Failed to parse user info from localStorage:', error)
      }
    }
  }, [])

  // Function to update user info and save to localStorage
  const setUserInfo = (newUserInfo: UserInfo) => {
    setUserInfoState(newUserInfo)
    setIsUserInfoSet(true)
    localStorage.setItem('incidentCommander_userInfo', JSON.stringify(newUserInfo))
  }

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, isUserInfoSet }}>
      {children}
    </UserContext.Provider>
  )
}
