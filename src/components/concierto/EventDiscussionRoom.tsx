import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'

interface ChatMessage {
  id: string
  user_name: string
  user_type: 'artist' | 'audience' | 'host' | 'system'
  user_avatar_url?: string
  message_text: string
  message_type: 'text' | 'system' | 'vote_notification'
  created_at: string
  reactions?: ChatReaction[]
}

interface ChatReaction {
  id: string
  user_name: string
  reaction_value: string
  count?: number
}

interface DiscussionRoom {
  id: string
  name: string
  description: string
  is_active: boolean
  participant_count: number
}

interface EventDiscussionRoomProps {
  eventId: string
  eventCode: string
  currentUser?: {
    name: string
    type: 'artist' | 'audience' | 'host'
    avatar?: string
  }
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

const EventDiscussionRoom: React.FC<EventDiscussionRoomProps> = ({
  eventId,
  eventCode,
  currentUser,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [room, setRoom] = useState<DiscussionRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [typing, setTyping] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const popularEmojis = ['❤️', '🎵', '🔥', '👏', '😍', '🤩', '💯', '🎶', '🎤', '⭐']

  useEffect(() => {
    loadDiscussionRoom()
    setupRealtimeSubscription()
    return () => {
      // Cleanup subscriptions
    }
  }, [eventId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadDiscussionRoom = async () => {
    try {
      // Get discussion room for event
      const { data: roomData, error: roomError } = await supabase
        .from('event_discussion_rooms')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single()

      if (roomData) {
        setRoom(roomData)
        setIsConnected(true)
        loadMessages(roomData.id)
      } else {
        console.log('No active discussion room found')
      }
    } catch (error) {
      console.error('Error loading discussion room:', error)
    }
  }

  const loadMessages = async (roomId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100)

      if (messagesData) {
        setMessages(messagesData)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    // TODO: Implement real-time subscriptions for chat messages
    // This would use Supabase real-time subscriptions
    console.log('Setting up real-time chat subscriptions...')
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !room || !currentUser) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          event_id: eventId,
          user_name: currentUser.name,
          user_type: currentUser.type,
          user_avatar_url: currentUser.avatar,
          message_text: newMessage.trim(),
          message_type: 'text'
        })

      if (!error) {
        setNewMessage('')
        // Messages will be updated via real-time subscription
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return

    try {
      await supabase
        .from('chat_reactions')
        .upsert({
          message_id: messageId,
          user_name: currentUser.name,
          reaction_type: 'emoji',
          reaction_value: emoji
        })
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'artist': return 'text-purple-400'
      case 'host': return 'text-yellow-400'
      case 'system': return 'text-blue-400'
      default: return 'text-gray-300'
    }
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'artist': return '🎤'
      case 'host': return '👑'
      case 'system': return '🤖'
      default: return '🎵'
    }
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <button
          onClick={onToggleMinimize}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span>💬</span>
            {participantCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {participantCount}
              </span>
            )}
          </div>
        </button>
      </motion.div>
    )
  }

  if (!room) {
    return (
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="font-medium mb-2">Chat Coming Soon</h3>
        <p className="text-sm text-gray-400">
          Discussion room will be available when the event goes live!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-gray-700/50 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-gray-700/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">{room.name}</h3>
            <p className="text-xs text-gray-400">
              {participantCount} watching • {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ➖
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-80 overflow-y-auto p-3 space-y-2 bg-black/20">
        <AnimatePresence initial={false}>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`flex items-start space-x-2 ${
                message.message_type === 'system' ? 'justify-center' : ''
              }`}
            >
              {message.message_type !== 'system' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-xs">
                  {message.user_avatar_url ? (
                    <img
                      src={message.user_avatar_url}
                      alt={message.user_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getUserTypeIcon(message.user_type)
                  )}
                </div>
              )}

              <div className={`flex-1 ${message.message_type === 'system' ? 'text-center' : ''}`}>
                {message.message_type !== 'system' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-medium ${getUserTypeColor(message.user_type)}`}>
                      {message.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                <p className={`text-sm ${
                  message.message_type === 'system'
                    ? 'text-blue-400 italic text-center'
                    : 'text-gray-200'
                }`}>
                  {message.message_text}
                </p>

                {/* Quick Reactions */}
                {message.message_type === 'text' && currentUser && (
                  <div className="flex items-center space-x-1 mt-1">
                    {popularEmojis.slice(0, 5).map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(message.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform opacity-0 group-hover:opacity-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />

        {/* Typing Indicators */}
        {typing.length > 0 && (
          <div className="text-xs text-gray-400 italic">
            {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>

      {/* Message Input */}
      {currentUser ? (
        <div className="border-t border-gray-700/50 p-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-xs">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getUserTypeIcon(currentUser.type)
              )}
            </div>

            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`Chat as ${currentUser.name}...`}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-sm focus:border-purple-500 focus:outline-none"
                maxLength={500}
              />

              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  newMessage.trim()
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
          </div>

          {/* Quick Emoji Bar */}
          <div className="flex items-center justify-center space-x-1 mt-2">
            {popularEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => setNewMessage(prev => prev + emoji)}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-700/50 p-3 text-center">
          <p className="text-sm text-gray-400">
            <button
              onClick={() => window.location.href = `/events/register/${eventCode}`}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Register
            </button>
            {' '}to join the chat
          </p>
        </div>
      )}

      {/* Twitch Integration Placeholder */}
      <div className="border-t border-gray-700/50 p-2 bg-purple-900/20">
        <div className="flex items-center justify-center space-x-2 text-xs text-purple-400">
          <span>🎮</span>
          <span>Twitch Integration: Coming Soon</span>
        </div>
      </div>
    </div>
  )
}

export default EventDiscussionRoom