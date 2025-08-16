import { useAuth } from '@/context/AuthContext'
import { Redirect, Slot } from 'expo-router'

export default function AppLayout() {
  const { session, error, redirectPage } = useAuth()

  return !session ? <Redirect href={redirectPage || (error?.page === 'signin' ? '/signin' : '/signup')} /> : <Slot />
}
