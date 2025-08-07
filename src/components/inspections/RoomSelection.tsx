'use client'

import { useState, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'

interface Room {
  id: string
  room_name: string
  room_type: 'standard' | 'custom'
  is_selected: boolean
  notes?: string
}

interface RoomSelectionProps {
  inspectionId: string
  onRoomsChange?: (rooms: Room[]) => void
  readonly?: boolean
}

// Common room types for properties
const STANDARD_ROOMS = [
  'Kitchen',
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Main Bathroom',
  'Ensuite Bathroom',
  'Toilet/Powder Room',
  'Dining Room',
  'Family Room',
  'Study/Office',
  'Laundry',
  'Garage',
  'Balcony/Deck',
  'Garden/Yard',
  'Basement',
  'Attic',
  'Hallway',
  'Entry/Foyer',
  'Pantry',
  'Walk-in Closet'
]

export default function RoomSelection({ inspectionId, onRoomsChange, readonly = false }: RoomSelectionProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [customRoomName, setCustomRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  
  const supabase = createClientSupabase()

  // Load existing rooms for this inspection
  useEffect(() => {
    loadRooms()
  }, [inspectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('room_type', { ascending: true })
        .order('room_name', { ascending: true })

      if (error) throw error

      setRooms(data || [])
      onRoomsChange?.(data || [])
    } catch (error) {
      console.error('Error loading rooms:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load rooms. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleRoom = async (roomName: string, roomType: 'standard' | 'custom' = 'standard') => {
    if (readonly) return

    setSaving(true)
    try {
      const existingRoom = rooms.find(r => r.room_name.toLowerCase() === roomName.toLowerCase())
      
      if (existingRoom) {
        // Toggle existing room
        const { error } = await supabase
          .from('rooms')
          .update({ is_selected: !existingRoom.is_selected })
          .eq('id', existingRoom.id)

        if (error) throw error

        const updatedRooms = rooms.map(room =>
          room.id === existingRoom.id
            ? { ...room, is_selected: !room.is_selected }
            : room
        )
        setRooms(updatedRooms)
        onRoomsChange?.(updatedRooms)
      } else {
        // Add new room
        const { data, error } = await supabase
          .from('rooms')
          .insert([{
            inspection_id: inspectionId,
            room_name: roomName,
            room_type: roomType,
            is_selected: true
          }])
          .select()

        if (error) throw error

        const updatedRooms = [...rooms, ...data]
        setRooms(updatedRooms)
        onRoomsChange?.(updatedRooms)
      }

      setMessage({
        type: 'success',
        text: 'Room updated successfully!'
      })
      
      // Clear success message after 2 seconds
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Error updating room:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update room. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const addCustomRoom = async () => {
    if (!customRoomName.trim() || readonly) return

    const roomName = customRoomName.trim()
    
    // Check if room already exists
    if (rooms.some(r => r.room_name.toLowerCase() === roomName.toLowerCase())) {
      setMessage({
        type: 'error',
        text: 'This room is already added to the inspection.'
      })
      return
    }

    await toggleRoom(roomName, 'custom')
    setCustomRoomName('')
  }

  const removeRoom = async (roomId: string) => {
    if (readonly) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)

      if (error) throw error

      const updatedRooms = rooms.filter(room => room.id !== roomId)
      setRooms(updatedRooms)
      onRoomsChange?.(updatedRooms)

      setMessage({
        type: 'success',
        text: 'Room removed successfully!'
      })
      
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Error removing room:', error)
      setMessage({
        type: 'error',
        text: 'Failed to remove room. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const isRoomSelected = (roomName: string) => {
    return rooms.some(r => r.room_name.toLowerCase() === roomName.toLowerCase() && r.is_selected)
  }

  const selectedRooms = rooms.filter(r => r.is_selected)
  const customRooms = rooms.filter(r => r.room_type === 'custom')

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">
            Select Rooms to Inspect
          </h1>
          <p className="text-gray-500">
            Choose which rooms you&apos;d like to include in this inspection.
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-50 text-red-800'
              : 'bg-green-50 text-green-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Selected Count */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Standard Rooms */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Common Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STANDARD_ROOMS.map((roomName) => (
              <label
                key={roomName}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  isRoomSelected(roomName)
                    ? 'bg-gray-50 border-gray-900'
                    : 'border-gray-200 hover:border-gray-300'
                } ${readonly ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isRoomSelected(roomName)}
                  onChange={() => toggleRoom(roomName)}
                  disabled={readonly || saving}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded mr-3"
                />
                <span className="font-medium text-gray-900">{roomName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Rooms */}
        {!readonly && (
          <div className="mb-12">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Add Custom Room</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={customRoomName}
                onChange={(e) => setCustomRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomRoom()}
                placeholder="Enter custom room name"
                className="flex-1 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent text-gray-900 placeholder-gray-400"
                disabled={saving}
              />
              <button
                onClick={addCustomRoom}
                disabled={!customRoomName.trim() || saving}
                className="px-6 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add Room'}
              </button>
            </div>
          </div>
        )}

        {/* Custom Rooms List */}
        {customRooms.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Custom Rooms</h2>
            <div className="space-y-3">
              {customRooms.map((room) => (
                <div
                  key={room.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    room.is_selected
                      ? 'bg-gray-50 border-gray-900'
                      : 'border-gray-200'
                  }`}
                >
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={room.is_selected}
                      onChange={() => toggleRoom(room.room_name, 'custom')}
                      disabled={readonly || saving}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded mr-3"
                    />
                    <span className="font-medium text-gray-900">{room.room_name}</span>
                  </label>
                  {!readonly && (
                    <button
                      onClick={() => removeRoom(room.id)}
                      disabled={saving}
                      className="ml-3 text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Rooms Summary */}
        {selectedRooms.length > 0 && (
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Selected Rooms ({selectedRooms.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {selectedRooms.map((room) => (
                <span
                  key={room.id}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {room.room_name}
                  {room.room_type === 'custom' && (
                    <span className="ml-2 text-xs text-gray-600">(Custom)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}