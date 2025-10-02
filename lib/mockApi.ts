import { Note, Trip } from '../types';

const delay = () => new Promise(resolve =>
    setTimeout(resolve, 300 + Math.random() * 500)
);

const shouldFail = () => false;

const toWireFormat = (obj: any): any => {
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(toWireFormat);
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = toWireFormat(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

const fromWireFormat = (obj: any): any => {
    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) return obj.map(fromWireFormat);
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = fromWireFormat(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

class MockDatabase {
    private trips: Map<string, Trip> = new Map();
    private notes: Map<string, Note> = new Map();

    constructor() {
        // Seed data
        const trip1: Trip = {
            id: '1',
            title: 'Tokyo Adventure',
            startDate: new Date('2024-03-15'),
            endDate: new Date('2024-03-22'),
            description: 'Exploring the vibrant streets of Tokyo',
            createdAt: new Date('2024-03-10'),
            updatedAt: new Date('2024-03-10'),
        };
        this.trips.set('1', trip1);

        const note1: Note = {
            id: 'n1',
            tripId: '1',
            content: 'Visited Sensoji Temple - absolutely beautiful!',
            createdAt: new Date('2024-03-16'),
            updatedAt: new Date('2024-03-16'),
        };
        this.notes.set('n1', note1);
    }

    getTrips(): Trip[] {
        return Array.from(this.trips.values()).sort(
            (a, b) => b.startDate.getTime() - a.startDate.getTime()
        );
    }

    getTripById(id: string): Trip | undefined {
        return this.trips.get(id);
    }

    createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Trip {
        const now = new Date();
        const newTrip: Trip = {
            ...trip,
            id: Date.now().toString(),
            createdAt: now,
            updatedAt: now,
        };
        this.trips.set(newTrip.id, newTrip);
        return newTrip;
    }

    updateTrip(id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>): Trip {
        const existing = this.trips.get(id);
        if (!existing) throw new Error('Trip not found');

        const updated: Trip = {
            ...existing,
            ...updates,
            id,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
        };
        this.trips.set(id, updated);
        return updated;
    }

    deleteTrip(id: string): void {
        if (!this.trips.has(id)) throw new Error('Trip not found');
        this.trips.delete(id);
        // Also delete associated notes
        Array.from(this.notes.entries()).forEach(([noteId, note]) => {
            if (note.tripId === id) {
                this.notes.delete(noteId);
            }
        });
    }

    createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
        const now = new Date();
        const newNote: Note = {
            ...note,
            id: Date.now().toString(),
            createdAt: now,
            updatedAt: now,
        };
        this.notes.set(newNote.id, newNote);
        return newNote;
    }

    deleteNote(id: string): void {
        if (!this.notes.has(id)) throw new Error('Note not found');
        this.notes.delete(id);
    }

    getNotes(tripId: string): Note[] {
        return Array.from(this.notes.values())
            .filter(note => note.tripId === tripId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}

const db = new MockDatabase();

export const mockApi = {
    async getTrips(): Promise<Trip[]> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        return db.getTrips();
    },

    async getTripById(id: string): Promise<Trip> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        const trip = db.getTripById(id);
        if (!trip) throw new Error('Trip not found');
        return trip;
    },

    async createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        return db.createTrip(trip);
    },

    async updateTrip(id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        return db.updateTrip(id, updates);
    },

    async deleteTrip(id: string): Promise<void> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        return db.deleteTrip(id);
    },

    async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        return db.createNote(note);
    },

    async deleteNote(id: string): Promise<void> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        return db.deleteNote(id);
    },

    async getNotes(tripId: string): Promise<Note[]> {
        await delay();
        if (shouldFail()) throw new Error('Network request failed');
        return db.getNotes(tripId);
    },
};