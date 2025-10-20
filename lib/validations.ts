import { z } from 'zod';

/**
 * Zod validation schema for moment form
 * Validates title (required, max 100 chars), description (optional, max 200 chars), date (required, valid date), and repeat frequency
 */
export const momentFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'Please enter a valid date'),
  repeatFrequency: z
    .enum(['none', 'daily', 'weekly', 'monthly', 'yearly'])
});

/**
 * TypeScript type inferred from Zod schema
 */
export type MomentFormData = z.infer<typeof momentFormSchema>;

/**
 * Validation schema for moment document (includes generated fields)
 */
export const momentDocumentSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  repeatFrequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']),
  createdAt: z.number(),
  updatedAt: z.number()
});

/**
 * TypeScript type for moment document
 */
export type MomentDocument = z.infer<typeof momentDocumentSchema>;

/**
 * Extended moment type with calculated fields for UI display
 */
export interface Moment extends MomentDocument {
  description?: string;
  daysDifference: number;
  displayText: string;
  status: 'past' | 'today' | 'future';
}