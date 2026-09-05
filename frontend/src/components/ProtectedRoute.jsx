import { Navigate } from 'react-router-dom'
import LoadingState from './LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingState />
  if (!user) return <Navigate replace to="/login" />
  if (allowedRole && user.role !== allowedRole) return <Navigate replace to="/role-selection" />
  return children
}
