import { mockApi } from '@/lib/mockApi'
import { Note, Trip } from '@/types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import AsyncStorage from '@react-native-async-storage/async-storage'
// State interface following Single Responsibility Principle
interface TravelJournalState {
    // Trip-related state
    trips: Trip[]
    isTripsLoading: boolean
    tripsError: string | null

    // Note-related state
    notes: Note[]
    isNotesLoading: boolean
    notesError: string | null

    // Actions - Use Cases Layer
    fetchTrips: () => Promise<void>
    fetchNotes: () => Promise<void>
    refreshData: () => Promise<void>
    clearErrors: () => void

    // Selectors for computed state
    getTripById: (id: string) => Trip | undefined
    getNoteById: (id: string) => Note | undefined
    getTripsCount: () => number
    getNotesCount: () => number

    // persistedData

    loadPersistedData: () => Promise<void>;
}

const persistData = async (trips: Trip[], notes: Note[]) => {
    const data = {
        trips,
        notes
    }
    await AsyncStorage.setItem('storage', JSON.stringify(data))
}

// Store implementation following Dependency Inversion Principle
export const useStore = create<TravelJournalState>()(
    devtools(
        (set, get) => ({
            // Initial state
            trips: [],
            isTripsLoading: false,
            tripsError: null,

            notes: [],
            isNotesLoading: false,
            notesError: null,

            loadPersistedData: async () => {
                const dataStr = await AsyncStorage.getItem('storage')
                if (dataStr) {
                    const data = JSON.parse(dataStr)
                    const { trips, notes } = data
                    set({ trips, notes })
                }
            },

            // Trip-related actions
            fetchTrips: async () => {
                set({ isTripsLoading: true, tripsError: null })

                try {
                    const trips = await mockApi.getTrips()
                    set({
                        trips,
                        isTripsLoading: false,
                        tripsError: null
                    })
                } catch (error) {
                    set({
                        isTripsLoading: false,
                        tripsError: error instanceof Error ? error.message : 'Failed to fetch trips'
                    })
                }
            },

            createTrip: async (trip: Trip) => {
                set({ isTripsLoading: true, tripsError: null })

                try {
                    await mockApi.createTrip(trip)
                } catch (error) {
                    set({
                        isTripsLoading: false,
                        tripsError: error instanceof Error ? error.message : 'Failed to fetch trips'
                    })
                }
            },

            // Note-related actions
            fetchNotes: async () => {
                set({ isNotesLoading: true, notesError: null })

                try {
                    const notes = await mockApi.getNotes()
                    set({
                        notes,
                        isNotesLoading: false,
                        notesError: null
                    })
                } catch (error) {
                    set({
                        isNotesLoading: false,
                        notesError: error instanceof Error ? error.message : 'Failed to fetch notes'
                    })
                }
            },

            // Compound action for refreshing all data
            refreshData: async () => {
                const { fetchTrips, fetchNotes } = get()
                await Promise.all([fetchTrips(), fetchNotes()])
            },

            // Error handling
            clearErrors: () => {
                set({ tripsError: null, notesError: null })
            },

            // Selectors - Interface Adapters Layer
            getTripById: (id: string) => {
                const { trips } = get()
                return trips.find(trip => trip.id === id)
            },

            getNoteById: (id: string) => {
                const { notes } = get()
                return notes.find(note => note.id === id)
            },

            getTripsCount: () => {
                const { trips } = get()
                return trips.length
            },

            getNotesCount: () => {
                const { notes } = get()
                return notes.length
            },
        }),
        {
            name: 'travel-journal-store', // For Redux DevTools
        }
    )
)

// Convenience hooks for specific slices (Open/Closed Principle)
export const useTrips = () => useStore((state) => ({
    trips: state.trips,
    isLoading: state.isTripsLoading,
    error: state.tripsError,
    fetchTrips: state.fetchTrips,
    getTripById: state.getTripById,
    getTripsCount: state.getTripsCount,
}))

export const useNotes = () => useStore((state) => ({
    notes: state.notes,
    isLoading: state.isNotesLoading,
    error: state.notesError,
    fetchNotes: state.fetchNotes,
    getNoteById: state.getNoteById,
    getNotesCount: state.getNotesCount,
}))

// Global actions hook
export const useTravelJournalActions = () => useStore((state) => ({
    refreshData: state.refreshData,
    clearErrors: state.clearErrors,
}))

// Loading states hook for UI components
export const useLoadingStates = () => useStore((state) => ({
    isTripsLoading: state.isTripsLoading,
    isNotesLoading: state.isNotesLoading,
    isAnyLoading: state.isTripsLoading || state.isNotesLoading,
}))

// Error states hook for error handling
export const useErrorStates = () => useStore((state) => ({
    tripsError: state.tripsError,
    notesError: state.notesError,
    hasAnyError: Boolean(state.tripsError || state.notesError),
    clearErrors: state.clearErrors,
}))