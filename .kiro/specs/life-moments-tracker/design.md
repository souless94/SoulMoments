# Design Document

## Overview

The Life Moments Tracker is a Progressive Web App (PWA) that provides a simple, tile-based interface for tracking important life events. The application uses modern web technologies to deliver a native-like mobile experience while maintaining full offline functionality through local storage and service workers.

## Architecture

### Technology Stack
- **Frontend Framework**: Next.js 15+ (App Router) with React 19+ for modern development experience
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS for utility-first responsive design and mobile optimization
- **Database**: RxDB with Dexie.js storage adapter for reactive offline-first data management
- **PWA Features**: Next.js built-in PWA support with service workers and manifest
- **TypeScript**: Full TypeScript support for type safety and better development experience

### Application Structure
```
src/
├── app/
│   ├── layout.tsx         # Root layout with PWA configuration
│   ├── page.tsx          # Main moments grid page
│   ├── globals.css       # Global Tailwind CSS and shadcn/ui imports
│   └── components/
│       ├── MomentTile.tsx    # Individual moment tile component using Card
│       ├── MomentGrid.tsx    # Responsive grid container
│       ├── MomentBanner.tsx  # Banner showing moment highlights and statistics
│       ├── AddMomentModal.tsx # Add/edit moment modal using Dialog
│       └── Header.tsx        # Navigation header
├── components/
│   └── ui/               # shadcn/ui components
│       ├── button.tsx    # Button component
│       ├── card.tsx      # Card component for tiles
│       ├── dialog.tsx    # Dialog component for modals
│       ├── input.tsx     # Input component for forms
│       └── label.tsx     # Label component for forms
├── lib/
│   ├── database.ts       # RxDB database setup and configuration
│   ├── schemas.ts        # RxDB schemas and Zod validation schemas
│   ├── validations.ts    # Zod form validation schemas
│   ├── hooks/
│   │   ├── useMoments.ts # Custom hook for moment operations
│   │   └── useDatabase.ts # Database connection hook
│   └── utils.ts          # Date calculations and utilities
├── types/
│   └── moment.ts         # TypeScript interfaces
└── public/
    ├── manifest.json     # PWA manifest
    └── icons/           # PWA icons
```

## Components and Interfaces

### Data Model
```typescript
// RxDB Schema
export interface MomentDocument {
  id: string;           // UUID primary key
  title: string;        // User-provided title (max 100 characters)
  description?: string; // Optional short description (max 200 characters)
  date: string;         // ISO date string (YYYY-MM-DD)
  repeatFrequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; // Repeat pattern
  createdAt: number;    // Unix timestamp
  updatedAt: number;    // Unix timestamp
}

// TypeScript interface for components
export interface Moment extends MomentDocument {
  daysDifference: number;  // Calculated field (to next occurrence for repeating events)
  displayText: string;     // "X days ago" / "X days until" / "Today"
  status: 'past' | 'today' | 'future';  // Status for styling and logic
  nextOccurrence?: string; // ISO date string for next occurrence (repeat events only)
  isRepeating: boolean;    // Convenience flag for repeat events
}
```

### Core Components

#### 1. Enhanced Tile Component (shadcn/ui Card with Advanced Interactions)
- **Purpose**: Compact visual representation of a single moment using Card component
- **Layout**: Card with CardHeader (title + today emoji), CardContent (description), and CardFooter (date)
- **Size**: Smaller, more compact tiles optimized for mobile viewing (min-h-[100px])
- **States**: Past events (muted variant), future events (primary variant), today (accent variant with emoji)
- **Advanced Interactions**: 
  - Tile click → Focus moment in banner (countdown change)
  - Hover → Show edit/delete action buttons in top-right corner
  - Edit button → Open modal for editing (event propagation stopped)
  - Delete button → Immediate delete with undo toast (event propagation stopped)
- **Action Buttons**: Lucide icons (Edit, Trash2) with shadcn/ui Button components
- **Accessibility**: Proper ARIA labels, keyboard navigation, and touch-friendly interactions

#### 2. Tile Grid
- **Layout**: CSS Grid with responsive columns (2 on mobile, 3 on tablet, 4-6 on desktop)
- **Spacing**: Tighter gap (12px) for more compact layout
- **Sorting**: Upcoming events first (including all repeat events), then past events
- **Repeat Event Handling**: All repeat events appear in upcoming section regardless of original date
- **Visual Separation**: "Past Moments" separator between upcoming and past events
- **Performance**: Virtual scrolling for large collections (100+ moments)

#### 3. Dynamic Moment Banner with Focus Capability
- **Purpose**: Prominent display of key moment information at the top of the page
- **Default Content**: Today's moments, next upcoming moment, recent past moment, and summary statistics
- **Repeat Event Handling**: For repeat events, shows countdown to next occurrence rather than original date
- **Focused Mode**: When tile is clicked, banner highlights that specific moment with:
  - Visual ring border (ring-2 ring-primary/30)
  - Focused moment's countdown to next occurrence (for repeat events)
  - Repeat indicator icon when applicable
  - Appropriate emoji based on moment status
- **Design**: Gradient background with emoji icons and responsive layout
- **State Management**: Maintains focused moment state, updates on edit, clears on delete
- **Visibility**: Only shown when moments exist, hidden for empty state

#### 4. Simplified Upsert Modal (shadcn/ui Dialog with React Hook Form)
- **Components**: Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- **Form Management**: React Hook Form with useForm hook for comprehensive state management
- **Upsert Approach**: Single interface for both create and edit operations
- **Fields**: 
  - Title: Input component with validation (required, max 100 chars)
  - Description: Input component for optional short description (max 200 chars)
  - Date: Native HTML5 date input with Label, integrated with react-hook-form
  - Repeat Frequency: shadcn/ui Select component with options (none, daily, weekly, monthly, yearly)
- **Validation**: Enhanced Zod schema validation with real-time error feedback for all fields
- **Actions**: Simplified to Save/Cancel only (delete moved to tile actions)
- **Loading States**: shadcn/ui Spinner component for form submission feedback
- **Mobile UX**: Responsive dialog that adapts to screen size
- **Error Handling**: Field-level and form-level error display using shadcn/ui error styling

#### 5. Navigation Header
- **Elements**: App title, Button component for Add action
- **Mobile**: Sticky header with touch-friendly Button sizes (44px minimum)
- **Accessibility**: Proper ARIA labels and keyboard navigation

#### 6. Toast Notification System (Sonner Integration)
- **Library**: Sonner for modern, accessible toast notifications
- **Integration**: Toaster component in root layout for global management
- **Delete Workflow**: 
  - Immediate success toast with undo action button
  - 5-second duration for user consideration
  - Undo button cancels deletion with confirmation toast
  - Auto-dismiss triggers actual deletion
- **Toast Actions**: Action buttons with proper event handling
- **Accessibility**: Screen reader compatible with proper ARIA attributes
- **Visual Design**: Consistent with shadcn/ui theme and styling

## Data Models

### RxDB Schema Configuration
```typescript
// RxDB Collection Schema
export const momentSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    title: { type: 'string', maxLength: 100 },
    description: { type: 'string', maxLength: 200 },
    date: { type: 'string', format: 'date' },
    repeatFrequency: { 
      type: 'string', 
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  required: ['id', 'title', 'date', 'repeatFrequency', 'createdAt', 'updatedAt'],
  indexes: ['date', 'createdAt', 'repeatFrequency']
};

// Database Configuration
export const dbConfig = {
  name: 'lifemomentsdb',
  storage: getRxStorageDexie(),
  collections: {
    moments: {
      schema: momentSchema
    }
  }
};
```

### Form Validation with Zod
```typescript
// Zod validation schema for moment form
import { z } from 'zod';

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
    .default('none')
});

export type MomentFormData = z.infer<typeof momentFormSchema>;

// React Hook Form integration
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<MomentFormData>({
  resolver: zodResolver(momentFormSchema),
  defaultValues: {
    title: '',
    description: '',
    date: '',
    repeatFrequency: 'none'
  }
});
```

### Date Calculations
```typescript
// Calculate next occurrence for repeating events
export function calculateNextOccurrence(
  originalDate: string, 
  repeatFrequency: string
): string {
  const original = new Date(originalDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let nextOccurrence = new Date(original);
  
  switch (repeatFrequency) {
    case 'daily':
      while (nextOccurrence <= today) {
        nextOccurrence.setDate(nextOccurrence.getDate() + 1);
      }
      break;
    case 'weekly':
      while (nextOccurrence <= today) {
        nextOccurrence.setDate(nextOccurrence.getDate() + 7);
      }
      break;
    case 'monthly':
      while (nextOccurrence <= today) {
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
      }
      break;
    case 'yearly':
      while (nextOccurrence <= today) {
        nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
      }
      break;
    default:
      return originalDate;
  }
  
  return nextOccurrence.toISOString().split('T')[0];
}

// Enhanced day difference calculation for repeat events
export function calculateDayDifference(
  momentDate: string, 
  repeatFrequency: string = 'none'
): {
  daysDifference: number;
  displayText: string;
  nextOccurrence?: string;
  status: 'past' | 'today' | 'future';
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let targetDate: Date;
  let nextOccurrence: string | undefined;
  
  // For repeating events, calculate next occurrence
  if (repeatFrequency !== 'none') {
    nextOccurrence = calculateNextOccurrence(momentDate, repeatFrequency);
    targetDate = new Date(nextOccurrence);
  } else {
    targetDate = new Date(momentDate);
  }
  
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let displayText: string;
  let status: 'past' | 'today' | 'future';
  
  if (diffDays === 0) {
    displayText = 'Today';
    status = 'today';
  } else if (diffDays > 0) {
    displayText = `${diffDays} days until`;
    status = 'future';
  } else {
    // For non-repeating events only
    displayText = `${Math.abs(diffDays)} days ago`;
    status = 'past';
  }
  
  // Repeating events are always considered upcoming
  if (repeatFrequency !== 'none') {
    status = status === 'today' ? 'today' : 'future';
  }
  
  return { daysDifference: diffDays, displayText, nextOccurrence, status };
}
```

## User Interface Design

### Visual Design System (shadcn/ui Theme)
- **Color System**: CSS custom properties with automatic dark mode support
  - Primary: `hsl(var(--primary))` - Main brand color
  - Secondary: `hsl(var(--secondary))` - Secondary actions
  - Accent: `hsl(var(--accent))` - Highlighted elements
  - Muted: `hsl(var(--muted))` - Subdued content
  - Destructive: `hsl(var(--destructive))` - Error states
- **Typography**: System font stack with consistent sizing scale
- **Spacing**: Tailwind's spacing scale (4px base unit)
- **Border Radius**: CSS custom property `var(--radius)` for consistent rounding
- **Shadows**: Tailwind shadow utilities for depth and elevation

### Form Component with React Hook Form and shadcn/ui
```typescript
// AddMomentModal component with React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { momentFormSchema, type MomentFormData } from "@/lib/validations";

export function AddMomentModal({ open, onOpenChange, onSubmit }) {
  const form = useForm<MomentFormData>({
    resolver: zodResolver(momentFormSchema),
    defaultValues: { title: '', date: '' }
  });

  const handleSubmit = (data: MomentFormData) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Moment</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-destructive' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...form.register('date')}
              className={form.formState.errors.date ? 'border-destructive' : ''}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save Moment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Enhanced Tile Design with Hover Actions and Repeat Indicators
```typescript
// MomentTile component with advanced interactions and repeat support
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tileVariants = {
  past: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted/70",
  today: "bg-accent text-accent-foreground border-accent ring-2 ring-primary/20 hover:bg-accent/90",
  future: "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
};

// Component structure - Enhanced with repeat indicators
<Card className={cn(
  "transition-all duration-200 cursor-pointer select-none relative group",
  "hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]",
  "min-h-[100px] active:scale-[0.99]",
  tileVariants[status]
)}>
  {/* Action buttons - show on hover */}
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
    <Button
      size="sm"
      variant="secondary"
      className="h-6 w-6 p-0"
      onClick={handleEdit}
      aria-label="Edit moment"
    >
      <Edit className="h-3 w-3" />
    </Button>
    <Button
      size="sm"
      variant="destructive"
      className="h-6 w-6 p-0"
      onClick={handleDelete}
      aria-label="Delete moment"
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  </div>

  <CardHeader className="pb-1 px-3 pt-3">
    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 pr-16 flex items-center gap-1">
      {title}
      {status === 'today' && <span className="ml-1">🎉</span>}
      {isRepeating && (
        <Repeat className="h-3 w-3 text-muted-foreground flex-shrink-0" 
               aria-label="Repeating event" />
      )}
    </CardTitle>
  </CardHeader>
  <CardContent className="flex-1 px-3 py-1">
    {description && (
      <p className="text-xs leading-relaxed line-clamp-2">{description}</p>
    )}
  </CardContent>
  <CardFooter className="pt-1 pb-3 px-3">
    <p className="text-xs font-medium w-full text-center">
      {isRepeating ? `Next: ${formattedNextDate}` : formattedDate}
    </p>
  </CardFooter>
</Card>

// Enhanced moment processing for repeat events
const processedMoment = useMemo(() => {
  const calculation = calculateDayDifference(moment.date, moment.repeatFrequency);
  return {
    ...moment,
    ...calculation,
    isRepeating: moment.repeatFrequency !== 'none'
  };
}, [moment]);

// Delete with undo toast implementation
const handleDelete = (e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent tile click
  
  toast.success(`"${moment.title}" deleted`, {
    action: {
      label: "Undo",
      onClick: () => toast.success("Deletion cancelled"),
    },
    onDismiss: () => onDelete(moment),
    duration: 5000,
  });
};

// Grid sorting logic - Repeat events always in upcoming section
const sortedMoments = useMemo(() => {
  const processed = moments.map(moment => {
    const calculation = calculateDayDifference(moment.date, moment.repeatFrequency);
    return { ...moment, ...calculation, isRepeating: moment.repeatFrequency !== 'none' };
  });
  
  // Separate upcoming (including all repeat events) and past events
  const upcoming = processed.filter(m => m.status === 'future' || m.status === 'today' || m.isRepeating);
  const past = processed.filter(m => m.status === 'past' && !m.isRepeating);
  
  // Sort upcoming by days until (ascending), past by days ago (descending)
  upcoming.sort((a, b) => a.daysDifference - b.daysDifference);
  past.sort((a, b) => b.daysDifference - a.daysDifference);
  
  return { upcoming, past };
}, [moments]);

// Responsive grid classes - More columns for compact tiles
const gridClasses = "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-4";
```

## Repeat Event Logic

### Next Occurrence Calculation
The system calculates the next occurrence of repeat events based on the original date and frequency:

- **Daily**: Advances by 1 day until future date is found
- **Weekly**: Advances by 7 days until future date is found  
- **Monthly**: Advances by 1 month until future date is found
- **Yearly**: Advances by 1 year until future date is found

### Display Behavior
- **Tile Display**: Shows "Next: [date]" instead of original date for repeat events
- **Banner Display**: Shows countdown to next occurrence for repeat events
- **Grid Sorting**: All repeat events appear in upcoming section regardless of original date
- **Visual Indicator**: Repeat icon displayed on tiles with repeat frequency set
- **Status Override**: Repeat events are never marked as "past" - always "future" or "today"

### Interaction Patterns and User Experience

#### Tile Interaction Behaviors
- **Primary Click**: Focus moment in banner (changes countdown display)
- **Hover State**: Reveal edit and delete action buttons with smooth opacity transition
- **Edit Action**: Opens modal pre-filled with moment data for editing
- **Delete Action**: Immediate deletion with 5-second undo toast notification
- **Event Handling**: Proper event propagation control to prevent conflicts

#### Banner Focus System
- **Default State**: Shows overview of today's moments, next upcoming, and recent past
- **Focused State**: Highlights clicked moment with visual ring and detailed information
- **State Persistence**: Maintains focus until another moment is clicked or focused moment is deleted
- **Visual Feedback**: Ring border and enhanced styling for focused moment display

#### Modal Workflow
- **Create Mode**: Clean form with today's date as default
- **Edit Mode**: Pre-populated form with existing moment data
- **Validation**: Real-time feedback with Zod schema validation
- **Loading States**: Spinner feedback during form submission
- **Error Handling**: Field-level and form-level error display

#### Toast Notification System
- **Delete Confirmation**: Success toast with undo action button
- **Undo Window**: 5-second duration for user reconsideration
- **Action Feedback**: Confirmation toasts for undo and final deletion
- **Accessibility**: Screen reader compatible with proper ARIA attributes

### Responsive Breakpoints
- **Mobile**: < 640px (2 columns for better space utilization)
- **Small Tablet**: 640px - 768px (3 columns)
- **Tablet**: 768px - 1024px (4 columns)
- **Desktop**: 1024px - 1280px (5 columns)
- **Large Desktop**: > 1280px (6 columns with auto-fit minimum 200px)

## Error Handling

### Database Errors
- **RxDB Initialization Failed**: Error boundary with retry mechanism
- **Dexie.js Storage Issues**: Fallback error handling with user notification
- **Storage Quota Exceeded**: User notification with cleanup suggestions
- **Data Corruption**: RxDB migration handling and recovery options

### User Input Validation
- **Empty Title**: Inline error message, prevent form submission
- **Invalid Date**: Browser native validation with custom error styling
- **Duplicate Detection**: Optional warning for similar titles/dates

### Network Errors
- **Service Worker Registration**: Graceful degradation without offline features
- **Cache Failures**: Log errors, continue with network-only mode

## Testing Strategy

### Unit Tests
- Date calculation functions
- RxDB schema validation
- React component rendering (Jest + React Testing Library)
- Custom hooks testing

### Integration Tests
- Complete CRUD operations
- Offline functionality
- PWA installation flow

### Manual Testing
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS Safari, Android Chrome)
- Offline mode verification
- Performance testing with large datasets

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Touch target size verification

## Performance Considerations

### Loading Performance
- **Next.js Optimization**: Automatic code splitting and tree shaking
- **Tailwind CSS**: Purged CSS for minimal bundle size
- **Dynamic Imports**: Lazy load modal components and heavy dependencies
- **Image Optimization**: Next.js built-in image optimization for PWA icons

### Runtime Performance
- **React Optimization**: useMemo and useCallback for expensive calculations
- **RxDB Reactivity**: Efficient reactive queries that update only changed data
- **Virtual Scrolling**: React Window for large collections (100+ moments)
- **Debounced Operations**: 300ms delay for search and filter operations

### Database Performance
- **RxDB Queries**: Optimized reactive queries with proper indexing
- **Dexie.js Efficiency**: Leverages IndexedDB indexes for fast date-based queries
- **Batch Operations**: RxDB bulk operations for multiple document changes
- **Memory Management**: Proper subscription cleanup to prevent memory leaks

## Offline Strategy

### Next.js PWA Caching
- **Automatic Service Worker**: nextjs pwa handles service worker generation
- **App Shell Caching**: Static assets cached automatically
- **Runtime Caching**: Custom caching strategies for dynamic content
- **Update Strategy**: Workbox-powered background updates with user notification

### Data Synchronization
- **Local-First**: All operations work offline immediately
- **Conflict Resolution**: Last-write-wins for simplicity
- **Export/Import**: JSON format for manual data transfer

## Security Considerations

### Data Protection
- **Local Storage Only**: No server-side data transmission
- **Input Sanitization**: Prevent XSS through proper escaping
- **CSP Headers**: Content Security Policy for additional protection

### Privacy
- **No Analytics**: No user tracking or data collection
- **Local Processing**: All data remains on user's device
- **Clear Data Option**: Easy way to delete all stored data