/**
 * TypeScript interfaces for Life Moments Tracker
 */

/**
 * Repeat frequency options for moments
 */
export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Base moment document structure (matches RxDB schema)
 */
export interface MomentDocument {
  id: string;           // UUID primary key
  title: string;        // User-provided title (max 100 characters)
  description?: string; // Optional short description (max 200 characters)
  date: string;         // ISO date string (YYYY-MM-DD)
  repeatFrequency: RepeatFrequency; // How often this moment repeats
  createdAt: number;    // Unix timestamp
  updatedAt: number;    // Unix timestamp
}

/**
 * Extended moment interface with calculated display fields
 * Used by UI components for rendering
 */
export interface Moment extends MomentDocument {
  daysDifference: number;  // Calculated field: positive for future, negative for past, 0 for today
  displayText: string;     // Human-readable text: "X days ago" / "X days until" / "Today"
  status: 'past' | 'today' | 'future';  // Status for styling and logic
}

/**
 * Form data structure for creating/editing moments
 * Matches the Zod validation schema
 */
export interface MomentFormData {
  title: string;
  description?: string;
  date: string;
  repeatFrequency: RepeatFrequency;
}

/**
 * Props for moment-related components
 */
export interface MomentTileProps {
  moment: Moment;
  onClick?: (moment: Moment) => void;
  onEdit?: (moment: Moment) => void;
  onDelete?: (moment: Moment) => void;
}

export interface MomentGridProps {
  moments: Moment[];
  onMomentClick?: (moment: Moment) => void;
  onMomentEdit?: (moment: Moment) => void;
  onMomentDelete?: (moment: Moment) => void;
}

export interface AddMomentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MomentFormData) => void;
  editingMoment?: Moment | null;
  isLoading?: boolean;
}

/**
 * Database operation result types
 */
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Moment CRUD operations interface
 */
export interface MomentOperations {
  create: (data: MomentFormData) => Promise<DatabaseResult<Moment>>;
  update: (id: string, data: MomentFormData) => Promise<DatabaseResult<Moment>>;
  delete: (id: string) => Promise<DatabaseResult<void>>;
  getAll: () => Promise<DatabaseResult<Moment[]>>;
  getById: (id: string) => Promise<DatabaseResult<Moment>>;
}