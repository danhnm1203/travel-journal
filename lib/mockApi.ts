import { Trip } from "@/types";

const delay = () => new Promise(resolve => {
    setTimeout(resolve, 5000)
})

class MockData {
    private trips = new Map();
    private notes = new Map();

    constructor() {
        this.trips.set('1', {
            id: '1',
            title: 'trip 1',
            startDate: new Date(),
            endDate: new Date(),
            description: '',
            coverImage: ''
        })
        this.notes.set('1', {
            id: '1',
            content: 'trip 1',
            createdAt: new Date(),
        })
    }

    getTrips() {
        return Array.from(this.trips.values())
    }

    createTrip(trip: Trip) {
        const newTrip = {
            ...trip,
            id: Math.random(),
        }
        this.trips.set(newTrip.id, newTrip)
    }


    getNotes() {
        return Array.from(this.notes.values())
    }
}

const db = new MockData()

export const mockApi = {
    async getTrips() {
        await delay()
        return [{
            id: '1',
            title: 'trip 1',
            startDate: new Date(),
            endDate: new Date(),
            description: '',
            coverImage: ''
        }]
    },

    async createTrip(trip: Trip) {
        return db.createTrip(trip)
    },

    async getNotes() {
        await delay()
        return db.getNotes()
    }
}