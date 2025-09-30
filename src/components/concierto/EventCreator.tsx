import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface EventFormData {
  title: string
  description: string
  location: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  maxVotesPerParticipant: number
  allowMultipleVotes: boolean
}

interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  label: string
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, label }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)

  const today = new Date()
  const selected = selectedDate ? new Date(selectedDate) : null

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startDate = new Date(startOfMonth)
  startDate.setDate(startDate.getDate() - startOfMonth.getDay())

  const days = []
  const current = new Date(startDate)

  while (current <= endOfMonth || current.getDay() !== 0) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString()

  const isSelected = (date: Date) =>
    selected && date.toDateString() === selected.toDateString()

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth.getMonth()

  const isPastDate = (date: Date) =>
    date < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const handleDateClick = (date: Date) => {
    onDateSelect(date.toISOString().split('T')[0])
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none text-left flex items-center justify-between"
      >
        <span className={selectedDate ? 'text-white' : 'text-gray-400'}>
          {selectedDate ? formatDate(new Date(selectedDate)) : 'Select date'}
        </span>
        <span className="text-gray-400">📅</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg p-4 z-50 shadow-2xl">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              ←
            </button>
            <h3 className="text-lg font-semibold">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              →
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="p-2 text-center text-sm text-gray-400 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={isPastDate(day)}
                className={`p-2 text-sm rounded-lg transition-colors ${
                  isPastDate(day)
                    ? 'text-gray-600 cursor-not-allowed'
                    : isSelected(day)
                      ? 'bg-accent-yellow text-black font-bold'
                      : isToday(day)
                        ? 'bg-blue-600 text-white'
                        : isCurrentMonth(day)
                          ? 'text-white hover:bg-gray-800'
                          : 'text-gray-500 hover:bg-gray-800'
                }`}
              >
                {day.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface TimeWheelProps {
  selectedTime: string
  onTimeSelect: (time: string) => void
  label: string
}

const TimeWheel: React.FC<TimeWheelProps> = ({ selectedTime, onTimeSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hour, setHour] = useState(selectedTime ? parseInt(selectedTime.split(':')[0]) : 9)
  const [minute, setMinute] = useState(selectedTime ? parseInt(selectedTime.split(':')[1] || '0') : 0)
  const [period, setPeriod] = useState(selectedTime && parseInt(selectedTime.split(':')[0]) >= 12 ? 'PM' : 'AM')

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

  const formatTime = (h: number, m: number, p: string) => {
    const hour24 = p === 'PM' && h !== 12 ? h + 12 : h === 12 && p === 'AM' ? 0 : h
    return `${hour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const handleApply = () => {
    const time24 = formatTime(hour, minute, period)
    onTimeSelect(time24)
    setIsOpen(false)
  }

  const displayTime = selectedTime
    ? new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Select time'

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none text-left flex items-center justify-between"
      >
        <span className={selectedTime ? 'text-white' : 'text-gray-400'}>
          {displayTime}
        </span>
        <span className="text-gray-400">⏰</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg p-6 z-50 shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 text-center">Select Time</h3>

          <div className="flex items-center justify-center space-x-4">
            {/* Hour Wheel */}
            <div className="text-center">
              <label className="text-sm text-gray-400 mb-2 block">Hour</label>
              <div className="h-32 overflow-y-auto border border-gray-700 rounded-lg bg-black">
                {hours.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={`w-full py-2 px-4 text-center transition-colors ${
                      hour === h ? 'bg-accent-yellow text-black font-bold' : 'hover:bg-gray-800'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-2xl font-bold">:</div>

            {/* Minute Wheel */}
            <div className="text-center">
              <label className="text-sm text-gray-400 mb-2 block">Min</label>
              <div className="h-32 overflow-y-auto border border-gray-700 rounded-lg bg-black">
                {minutes.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={`w-full py-2 px-4 text-center transition-colors ${
                      minute === m ? 'bg-accent-yellow text-black font-bold' : 'hover:bg-gray-800'
                    }`}
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM Toggle */}
            <div className="text-center">
              <label className="text-sm text-gray-400 mb-2 block">Period</label>
              <div className="space-y-2">
                {['AM', 'PM'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`w-16 py-2 px-4 text-center border border-gray-700 rounded-lg transition-colors ${
                      period === p ? 'bg-accent-yellow text-black font-bold' : 'hover:bg-gray-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 bg-accent-yellow text-black rounded-lg font-bold hover:bg-accent-yellow/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const EventCreator: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    maxVotesPerParticipant: 5,
    allowMultipleVotes: false
  })

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateShareableCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      // Combine date and time for database storage
      const startDateTime = `${formData.startDate}T${formData.startTime}:00`
      const endDateTime = `${formData.endDate}T${formData.endTime}:00`

      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location || null,
        start_date: startDateTime,
        end_date: endDateTime,
        max_votes_per_participant: formData.maxVotesPerParticipant,
        allow_multiple_votes: formData.allowMultipleVotes,
        shareable_code: generateShareableCode(),
        host_user_id: user.id,
        status: 'draft', // Create events as draft, publish them via dashboard
        mediaid_integration_enabled: true,
        privacy_mode: 'balanced'
      }

      const { data: event, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (error) {
        console.error('Error creating event:', error)
        throw error
      }

      // Navigate to event management dashboard
      navigate(`/events/manage/${event.id}`)
    } catch (error) {
      console.error('Failed to create event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-6">You need to sign in to create events</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-accent-yellow text-black px-6 py-3 rounded-xl font-bold"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/events')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Events
              </button>
              <div>
                <h1 className="text-2xl font-bold">Create Event</h1>
                <p className="text-gray-400">Step {currentStep} of 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step <= currentStep
                    ? 'bg-accent-yellow text-black font-bold'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 ${
                    step < currentStep ? 'bg-accent-yellow' : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-8"
        >
          {currentStep === 1 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Event Basics</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Battle of the Bands 2025"
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="An exciting voting competition to find the best local artist..."
                    rows={4}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                  />
                </div>

                {/* Location Field */}
                <div>
                  <label className="block text-sm font-medium mb-2">📍 Event Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateFormData({ location: e.target.value })}
                    placeholder="123 Music Venue, Downtown District, NY 10001"
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    🔮 Future: Google Maps integration for venue search and directions
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Calendar
                      selectedDate={formData.startDate}
                      onDateSelect={(date) => updateFormData({ startDate: date })}
                      label="Start Date"
                    />
                    <TimeWheel
                      selectedTime={formData.startTime}
                      onTimeSelect={(time) => updateFormData({ startTime: time })}
                      label="Start Time"
                    />
                  </div>

                  <div className="space-y-4">
                    <Calendar
                      selectedDate={formData.endDate}
                      onDateSelect={(date) => updateFormData({ endDate: date })}
                      label="End Date"
                    />
                    <TimeWheel
                      selectedTime={formData.endTime}
                      onTimeSelect={(time) => updateFormData({ endTime: time })}
                      label="End Time"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Voting Rules</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Votes Per Participant</label>
                  <select
                    value={formData.maxVotesPerParticipant}
                    onChange={(e) => updateFormData({ maxVotesPerParticipant: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-accent-yellow focus:outline-none"
                  >
                    {[1, 3, 5, 10].map(num => (
                      <option key={num} value={num}>{num} votes per person</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.allowMultipleVotes}
                      onChange={(e) => updateFormData({ allowMultipleVotes: e.target.checked })}
                      className="w-5 h-5 bg-black border border-gray-700 rounded focus:border-accent-yellow"
                    />
                    <div>
                      <div className="font-medium">Allow Multiple Votes Per Artist</div>
                      <div className="text-sm text-gray-400">
                        Let participants vote multiple times for the same artist
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Review & Create</h2>

              <div className="space-y-4 mb-8">
                <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-2">📝 Event Details</h3>
                  <div className="space-y-2">
                    <p><strong>Title:</strong> {formData.title || 'Untitled Event'}</p>
                    <p><strong>Description:</strong> {formData.description || 'No description'}</p>
                  </div>
                </div>

                <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-2">📅 Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Start:</strong></p>
                      <p className="text-accent-yellow">
                        {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        }) : 'Not set'}
                      </p>
                      <p className="text-gray-400">
                        {formData.startTime ? new Date(`2000-01-01T${formData.startTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit', hour12: true
                        }) : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p><strong>End:</strong></p>
                      <p className="text-accent-yellow">
                        {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        }) : 'Not set'}
                      </p>
                      <p className="text-gray-400">
                        {formData.endTime ? new Date(`2000-01-01T${formData.endTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit', hour12: true
                        }) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-2">🗳️ Voting Rules</h3>
                  <div className="space-y-2">
                    <p><strong>Votes per participant:</strong> {formData.maxVotesPerParticipant}</p>
                    <p><strong>Multiple votes per artist:</strong> {formData.allowMultipleVotes ? 'Yes' : 'No'}</p>
                    <p><strong>MediaID Integration:</strong> <span className="text-blue-400">Enabled</span></p>
                    <p><strong>Privacy Mode:</strong> <span className="text-green-400">Balanced</span></p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700 transition-colors'
              }`}
            >
              Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-bold hover:bg-accent-yellow/90 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 ${
                  isSubmitting
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isSubmitting ? 'Creating Event...' : 'Create Event'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default EventCreator