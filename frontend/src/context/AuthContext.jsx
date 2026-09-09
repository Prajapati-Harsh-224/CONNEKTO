import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, login, logout } from '../services/authService.js'
import { getSelectedRole } from '../utils/roleStorage.js'

const AuthContext = createContext(null)

function getDemoUserFromRole() {
  const selectedRole = getSelectedRole() || 'SUPPLIER'
  return {
    id: 'demo-user',
    name: 'Supplier Demo',
    role: selectedRole,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((response) => setUser(response?.data?.user || getDemoUserFromRole()))
      .catch(() => setUser(getDemoUserFromRole()))
      .finally(() => setIsLoading(false))
  }, [])

  async function signIn(credentials) {
    const response = await login(credentials)
    setUser(response.data.user)
    return response.data.user
  }

  async function signOut() {
    await logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
