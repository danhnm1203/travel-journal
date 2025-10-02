export interface Trip {
    id: string
    title: string
    startDate: Date
    endDate: Date
    description?: string
    coverImage?: string
    createdAt: Date
    updatedAt: Date
}

export interface Note {
    id: string
    tripId: string
    content: string
    createdAt: Date
    updatedAt: Date
}

export interface OutboxItem {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'trip' | 'note';
    data: any;
    timestamp: number;
    retries: number;
}