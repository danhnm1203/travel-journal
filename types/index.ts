export interface Trip {
    id: string
    title: string
    startDate: Date
    endDate: Date
    description?: string
    coverImage?: string
}

export interface Note {
    id: string
    content: string
    createdAt: Date
}