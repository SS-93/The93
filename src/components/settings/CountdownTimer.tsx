import React, { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: string
  onExpire?: () => void
}

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
  total: number
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onExpire }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 })
        if (onExpire) {
          onExpire()
        }
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ hours, minutes, seconds, total: difference })
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onExpire])

  const formatNumber = (num: number) => num.toString().padStart(2, '0')

  const getUrgencyColor = () => {
    const hoursRemaining = timeRemaining.hours
    if (hoursRemaining <= 2) return 'text-red-400 bg-red-500/20'
    if (hoursRemaining <= 6) return 'text-yellow-400 bg-yellow-500/20'
    return 'text-green-400 bg-green-500/20'
  }

  const getProgressPercentage = () => {
    const totalHours = 24
    const hoursRemaining = timeRemaining.hours + (timeRemaining.minutes / 60) + (timeRemaining.seconds / 3600)
    return Math.max(0, Math.min(100, (hoursRemaining / totalHours) * 100))
  }

  if (timeRemaining.total <= 0) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-red-400 font-semibold">Request Expired</p>
            <p className="text-gray-400 text-sm">Your request has expired and will need to be resubmitted</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Countdown Display */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-gray-400">Review window expires in:</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className={`px-2 py-1 rounded text-sm font-mono font-semibold ${getUrgencyColor()}`}>
            {formatNumber(timeRemaining.hours)}h {formatNumber(timeRemaining.minutes)}m {formatNumber(timeRemaining.seconds)}s
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeRemaining.hours <= 2 ? 'bg-red-400' :
              timeRemaining.hours <= 6 ? 'bg-yellow-400' :
              'bg-green-400'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Expired</span>
          <span>24h remaining</span>
        </div>
      </div>

      {/* Urgency Message */}
      {timeRemaining.hours <= 6 && (
        <div className={`p-3 rounded-lg ${
          timeRemaining.hours <= 2 
            ? 'bg-red-500/10 border border-red-500/30' 
            : 'bg-yellow-500/10 border border-yellow-500/30'
        }`}>
          <p className={`text-sm ${
            timeRemaining.hours <= 2 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {timeRemaining.hours <= 2 
              ? '⚠️ Your request expires soon! Our team will review it shortly.'
              : '⏰ Your request will be reviewed soon. Check back later for updates.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default CountdownTimer
