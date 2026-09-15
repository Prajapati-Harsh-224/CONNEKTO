import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, login, logout } from '../services/authService.js'
import { saveSelectedRole } from '../utils/roleStorage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((response) => {
        const realUser = response?.data?.user || null
        setUser(realUser)
        if (realUser?.role) saveSelectedRole(realUser.role)
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function signIn(credentials) {
    const response = await login(credentials)
    const realUser = response?.data?.user || null
    setUser(realUser)
    if (realUser?.role) saveSelectedRole(realUser.role)
    return realUser
  }

  async function signOut() {
    await logout().catch(() => { })
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
