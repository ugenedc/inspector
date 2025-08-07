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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Select Rooms to Inspect
        </h2>
        <span className="text-sm text-gray-500">
          {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Standard Rooms */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Common Rooms</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {STANDARD_ROOMS.map((roomName) => (
            <label
              key={roomName}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                isRoomSelected(roomName)
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
              } ${readonly ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={isRoomSelected(roomName)}
                onChange={() => toggleRoom(roomName)}
                disabled={readonly || saving}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
              />
              <span className="text-sm font-medium">{roomName}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Rooms */}
      {!readonly && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Add Custom Room</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={customRoomName}
              onChange={(e) => setCustomRoomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomRoom()}
              placeholder="Enter custom room name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={saving}
            />
            <button
              onClick={addCustomRoom}
              disabled={!customRoomName.trim() || saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Adding...' : 'Add Room'}
            </button>
          </div>
        </div>
      )}

      {/* Custom Rooms List */}
      {customRooms.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Custom Rooms</h3>
          <div className="space-y-2">
            {customRooms.map((room) => (
              <div
                key={room.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  room.is_selected
                    ? 'bg-indigo-50 border-indigo-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <label className="flex items-center cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={room.is_selected}
                    onChange={() => toggleRoom(room.room_name, 'custom')}
                    disabled={readonly || saving}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                  />
                  <span className="text-sm font-medium text-gray-900">{room.room_name}</span>
                </label>
                {!readonly && (
                  <button
                    onClick={() => removeRoom(room.id)}
                    disabled={saving}
                    className="ml-3 text-red-600 hover:text-red-800 text-sm font-medium"
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
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Selected Rooms ({selectedRooms.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedRooms.map((room) => (
              <span
                key={room.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
              >
                {room.room_name}
                {room.room_type === 'custom' && (
                  <span className="ml-1 text-xs text-indigo-600">(Custom)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}