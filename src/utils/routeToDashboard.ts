import { NavigateFunction } from 'react-router-dom'

export const routeToDashboard = (role: string, navigate: NavigateFunction) => {
  const routeMap: Record<string, string> = {
    fan: '/dashboard/fan',
    artist: '/dashboard/artist',
    brand: '/dashboard/brand',
    admin: '/dashboard/admin',
  }
  
  const route = routeMap[role] || '/dashboard/fan'
  navigate(route)
}

export const getRoleFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/dashboard\/(\w+)/)
  return match ? match[1] : null
} 