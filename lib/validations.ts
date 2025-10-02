import { z } from 'zod';

export const TripFormSchema = z.object({
  title: z.string().min(1, 'Trip title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  coverImage: z.string().optional(),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return startDate <= endDate;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

export const NoteFormSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(5000, 'Note too long'),
  tripId: z.string().min(1, 'Trip ID is required'),
});

export type TripFormData = z.infer<typeof TripFormSchema>;
export type NoteFormData = z.infer<typeof NoteFormSchema>;