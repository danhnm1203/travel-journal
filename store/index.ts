import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { mockApi } from '../lib/mockApi';
import { Note, OutboxItem, Trip } from '../types';
interface AppState {
    trips: Trip[];
    notes: Note[];
    loading: boolean;
    error: string | null;
    isOnline: boolean;
    outbox: OutboxItem[];
    isInitialized: boolean;
    storageError: boolean;
    loadPersistedData: () => Promise<void>;
    fetchTrips: () => Promise<void>;
    fetchNotes: (tripId: string) => Promise<void>;
    createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateTrip: (id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;
    createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    deleteNote: (id: string) => Promise<void>;
    processOutbox: () => Promise<void>;
    setOnline: (online: boolean) => Promise<void>;
    getTripById: (id: string) => Trip | undefined;
    getNotesByTripId: (tripId: string) => Note[];
    clearStorageAndReset: () => Promise<void>;
}
const STORAGE_KEY = '@travel-journal';
const OUTBOX_KEY = '@travel-journal:outbox';
const toStorageFormat = (obj: any): any => {
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(toStorageFormat);
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = toStorageFormat(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};
const fromStorageFormat = (obj: any): any => {
    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) return obj.map(fromStorageFormat);
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = fromStorageFormat(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};
const persistData = async (trips: Trip[], notes: Note[]) => {
    try {
        const data = {
            trips: toStorageFormat(trips),
            notes: toStorageFormat(notes),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to persist data:', error);
    }
};
const persistOutbox = async (outbox: OutboxItem[]) => {
    try {
        await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    } catch (error) {
        console.error('Failed to persist outbox:', error);
    }
};
const mergeWithConflictResolution = <T extends { id: string; updatedAt: Date }>(
    localItems: T[],
    serverItems: T[]
): T[] => {
    const merged = new Map<string, T>();

    [...localItems, ...serverItems].forEach(item => {
        const existing = merged.get(item.id);
        if (!existing || item.updatedAt.getTime() > existing.updatedAt.getTime()) {
            merged.set(item.id, item);
        }
    });

    return Array.from(merged.values());
};
export const useStore = create<AppState>((set, get) => ({
    trips: [],
    notes: [],
    loading: false,
    error: null,
    isOnline: true,
    outbox: [],
    isInitialized: false,
    storageError: false,
    loadPersistedData: async () => {
        try {
            const [dataStr, outboxStr] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY),
                AsyncStorage.getItem(OUTBOX_KEY),
            ]);
            if (dataStr) {
                const data = JSON.parse(dataStr);
                const trips = fromStorageFormat(data.trips);
                const notes = fromStorageFormat(data.notes);
                set({ trips, notes });
            }
            if (outboxStr) {
                const outbox = JSON.parse(outboxStr);
                set({ outbox });
            }
            set({ isInitialized: true, storageError: false });
        } catch (error) {
            console.error('Failed to load persisted data:', error);
            set({ isInitialized: true, storageError: true });
        }
    },
    fetchTrips: async () => {
        if (!get().isOnline) return;
        set({ loading: true, error: null });
        try {
            const serverTrips = await mockApi.getTrips();
            const localTrips = get().trips;
            const mergedTrips = mergeWithConflictResolution(localTrips, serverTrips);
            set({ trips: mergedTrips, loading: false });
            persistData(mergedTrips, get().notes);
            console.log('🔄 Trips merged with conflict resolution (last-write-wins)');
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },
    fetchNotes: async (tripId: string) => {
        if (!get().isOnline) return;
        try {
            const serverNotes = await mockApi.getNotes(tripId);
            const localNotes = get().notes.filter(n => n.tripId === tripId);
            const otherNotes = get().notes.filter(n => n.tripId !== tripId);
            const mergedNotesForTrip = mergeWithConflictResolution(localNotes, serverNotes);
            const allNotes = [...otherNotes, ...mergedNotesForTrip];
            set({ notes: allNotes });
            persistData(get().trips, allNotes);
            console.log(`🔄 Notes for trip ${tripId} merged with conflict resolution`);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        }
    },
    createTrip: async (tripData) => {
        if (!get().isOnline) {
            const tempId = `temp-${Date.now()}`;
            const now = new Date();
            const optimisticTrip: Trip = {
                ...tripData,
                id: tempId,
                createdAt: now,
                updatedAt: now,
            };
            const trips = [optimisticTrip, ...get().trips];
            set({ trips });
            persistData(trips, get().notes);
            const outbox = [...get().outbox, {
                id: tempId,
                type: 'create' as const,
                entity: 'trip' as const,
                data: tripData,
                timestamp: Date.now(),
                retries: 0,
            }];
            set({ outbox });
            persistOutbox(outbox);
            return tempId;
        }
        try {
            const created = await mockApi.createTrip(tripData);
            const trips = [created, ...get().trips];
            set({ trips });
            persistData(trips, get().notes);
            return created.id;
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },
    createNote: async (noteData) => {
        if (!get().isOnline) {
            const tempId = `temp-note-${Date.now()}`;
            const optimisticNote: Note = {
                ...noteData,
                id: tempId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const notes = [optimisticNote, ...get().notes];
            set({ notes });
            persistData(get().trips, notes);
            const outbox = [...get().outbox, {
                id: tempId,
                type: 'create' as const,
                entity: 'note' as const,
                data: noteData,
                timestamp: Date.now(),
                retries: 0,
            }];
            set({ outbox });
            persistOutbox(outbox);
            return tempId;
        }
        try {
            const created = await mockApi.createNote(noteData);
            const notes = [created, ...get().notes];
            set({ notes });
            persistData(get().trips, notes);
            return created.id;
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },
    updateTrip: async (id, updates) => {
        if (!get().isOnline) {
            const updatedTrips = get().trips.map(trip =>
                trip.id === id ? { ...trip, ...updates, updatedAt: new Date() } : trip
            );
            set({ trips: updatedTrips });
            persistData(updatedTrips, get().notes);
            const outbox = [...get().outbox, {
                id: `update-trip-${Date.now()}`,
                type: 'update' as const,
                entity: 'trip' as const,
                data: { id, updates },
                timestamp: Date.now(),
                retries: 0,
            }];
            set({ outbox });
            persistOutbox(outbox);
            return;
        }
        try {
            const updated = await mockApi.updateTrip(id, updates);
            const updatedTrips = get().trips.map(trip =>
                trip.id === id ? updated : trip
            );
            set({ trips: updatedTrips });
            persistData(updatedTrips, get().notes);
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        }
    },
    deleteTrip: async (id) => {
        const originalTrip = get().trips.find(t => t.id === id);
        if (!originalTrip) throw new Error('Trip not found');
        const filteredTrips = get().trips.filter(trip => trip.id !== id);
        const filteredNotes = get().notes.filter(note => note.tripId !== id);
        set({ trips: filteredTrips, notes: filteredNotes });
        persistData(filteredTrips, filteredNotes);
        if (!get().isOnline) {
            const outbox = [...get().outbox, {
                id: `delete-trip-${Date.now()}`,
                type: 'delete' as const,
                entity: 'trip' as const,
                data: { id },
                timestamp: Date.now(),
                retries: 0,
            }];
            set({ outbox });
            persistOutbox(outbox);
            return;
        }
        try {
            await mockApi.deleteTrip(id);
        } catch (error) {
            const rollbackTrips = [...get().trips, originalTrip];
            set({ trips: rollbackTrips, error: (error as Error).message });
            persistData(rollbackTrips, get().notes);
            throw error;
        }
    },
    deleteNote: async (id) => {
        const originalNote = get().notes.find(n => n.id === id);
        if (!originalNote) throw new Error('Note not found');
        const filteredNotes = get().notes.filter(note => note.id !== id);
        set({ notes: filteredNotes });
        persistData(get().trips, filteredNotes);
        if (!get().isOnline) {
            const outbox = [...get().outbox, {
                id: `delete-note-${Date.now()}`,
                type: 'delete' as const,
                entity: 'note' as const,
                data: { id },
                timestamp: Date.now(),
                retries: 0,
            }];
            set({ outbox });
            persistOutbox(outbox);
            return;
        }
        try {
            await mockApi.deleteNote(id);
        } catch (error) {
            const rollbackNotes = [...get().notes, originalNote];
            set({ notes: rollbackNotes, error: (error as Error).message });
            persistData(get().trips, rollbackNotes);
            throw error;
        }
    },
    processOutbox: async () => {
        if (!get().isOnline || get().outbox.length === 0) return;
        const outbox = [...get().outbox];
        for (const item of outbox) {
            try {
                if (item.entity === 'trip') {
                    if (item.type === 'create') {
                        const created = await mockApi.createTrip(item.data);
                        const updatedTrips = get().trips.map(t => t.id === item.id ? created : t);
                        set({ trips: updatedTrips });
                        persistData(updatedTrips, get().notes);
                    } else if (item.type === 'update') {
                        try {
                            const updated = await mockApi.updateTrip(item.data.id, item.data.updates);
                            const updatedTrips = get().trips.map(t => t.id === item.data.id ? updated : t);
                            set({ trips: updatedTrips });
                            persistData(updatedTrips, get().notes);
                        } catch (error) {
                            if ((error as Error).message === 'Trip not found') {
                                console.log(`⚠️ Trip ${item.data.id} not found on server, skipping update`);
                                const filteredTrips = get().trips.filter(t => t.id !== item.data.id);
                                set({ trips: filteredTrips });
                                persistData(filteredTrips, get().notes);
                            } else {
                                throw error;
                            }
                        }
                    } else if (item.type === 'delete') {
                        try {
                            await mockApi.deleteTrip(item.data.id);
                        } catch (error) {
                            if ((error as Error).message === 'Trip not found') {
                                console.log(`⚠️ Trip ${item.data.id} already deleted on server`);
                            } else {
                                throw error;
                            }
                        }
                        const filteredTrips = get().trips.filter(t => t.id !== item.data.id);
                        const filteredNotes = get().notes.filter(n => n.tripId !== item.data.id);
                        set({ trips: filteredTrips, notes: filteredNotes });
                        persistData(filteredTrips, filteredNotes);
                    }
                } else if (item.entity === 'note') {
                    if (item.type === 'create') {
                        try {
                            const created = await mockApi.createNote(item.data);
                            const updatedNotes = get().notes.map(n => n.id === item.id ? created : n);
                            set({ notes: updatedNotes });
                            persistData(get().trips, updatedNotes);
                        } catch (error) {
                            if ((error as Error).message.includes('Trip not found')) {
                                console.log(`⚠️ Trip for note ${item.id} not found on server, removing note`);
                                const filteredNotes = get().notes.filter(n => n.id !== item.id);
                                set({ notes: filteredNotes });
                                persistData(get().trips, filteredNotes);
                            } else {
                                throw error;
                            }
                        }
                    } else if (item.type === 'delete') {
                        try {
                            await mockApi.deleteNote(item.data.id);
                        } catch (error) {
                            if ((error as Error).message === 'Note not found') {
                                console.log(`⚠️ Note ${item.data.id} already deleted on server`);
                            } else {
                                throw error;
                            }
                        }
                        const filteredNotes = get().notes.filter(n => n.id !== item.data.id);
                        set({ notes: filteredNotes });
                        persistData(get().trips, filteredNotes);
                    }
                }
                const newOutbox = get().outbox.filter(i => i.id !== item.id);
                set({ outbox: newOutbox });
                persistOutbox(newOutbox);
            } catch (error) {
                console.error('Failed to process outbox item:', error);
                const newOutbox = get().outbox.map(i =>
                    i.id === item.id ? { ...i, retries: i.retries + 1 } : i
                );
                set({ outbox: newOutbox });
                persistOutbox(newOutbox);
            }
        }
    },
    setOnline: async (online) => {
        set({ isOnline: online });
        if (online) {
            try {
                await get().processOutbox();
                await get().fetchTrips();
                console.log('✅ Sync completed: Outbox processed and data merged with conflict resolution');
            } catch (error) {
                console.error('❌ Sync failed:', error);
                set({ error: (error as Error).message });
            }
        }
    },
    getTripById: (id) => get().trips.find(t => t.id === id),
    getNotesByTripId: (tripId) =>
        get().notes.filter(n => n.tripId === tripId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    clearStorageAndReset: async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEY),
                AsyncStorage.removeItem(OUTBOX_KEY),
            ]);
            set({
                trips: [],
                notes: [],
                outbox: [],
                error: null,
                storageError: false,
                isInitialized: true,
            });
            console.log('✅ Storage cleared and app reset successfully');
        } catch (error) {
            console.error('Failed to clear storage:', error);
            throw error;
        }
    },
}));
