import { NavigateFunction } from 'react-router-dom'

export const routeToDashboard = (role: string, navigate: NavigateFunction) => {
  switch (role) {
    case 'fan':
      navigate('/dashboard/fan')
      break
    case 'artist':
      navigate('/dashboard/artist')
      break
    case 'brand':
      navigate('/dashboard/brand')
      break
    case 'developer':
      navigate('/dashboard/developer')
      break
    default:
      navigate('/dashboard/fan')
  }
}

export const getRoleFromPath = (pathname: string): string | null => {
  const matches = pathname.match(/\/dashboard\/(\w+)/)
  return matches ? matches[1] : null
} 