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
  createdAt: number;    // Unix timestamp
  updatedAt: number;    // Unix timestamp
}

// TypeScript interface for components
export interface Moment extends MomentDocument {
  daysDifference: number;  // Calculated field
  displayText: string;     // "X days ago" / "X days until" / "Today"
  status: 'past' | 'today' | 'future';  // Status for styling and logic
}
```

### Core Components

#### 1. Tile Component (shadcn/ui Card)
- **Purpose**: Compact visual representation of a single moment using Card component
- **Layout**: Card with CardHeader (title + today emoji), CardContent (description), and CardFooter (date)
- **Size**: Smaller, more compact tiles optimized for mobile viewing
- **States**: Past events (muted variant), future events (primary variant), today (accent variant with emoji)
- **Interactions**: Tap to edit/delete, accessible keyboard navigation

#### 2. Tile Grid
- **Layout**: CSS Grid with responsive columns (2 on mobile, 3 on tablet, 4-6 on desktop)
- **Spacing**: Tighter gap (12px) for more compact layout
- **Sorting**: Chronological order with upcoming events first, then past events
- **Performance**: Virtual scrolling for large collections (100+ moments)

#### 3. Moment Banner
- **Purpose**: Prominent display of key moment information at the top of the page
- **Content**: Today's moments, next upcoming moment, recent past moment, and summary statistics
- **Design**: Gradient background with emoji icons and responsive layout
- **Visibility**: Only shown when moments exist, hidden for empty state

#### 4. Add/Edit Modal (shadcn/ui Dialog with React Hook Form)
- **Components**: Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- **Form Management**: React Hook Form with useForm hook for comprehensive state management
- **Fields**: 
  - Title: Input component with validation (required, max 100 chars)
  - Description: Input component for optional short description (max 200 chars)
  - Date: Native HTML5 date input with Label, integrated with react-hook-form
- **Validation**: Enhanced Zod schema validation with real-time error feedback for all fields
- **Actions**: Button components for Save/Cancel/Delete with proper variants and form submission handling
- **Mobile UX**: Responsive dialog that adapts to screen size
- **Error Handling**: Field-level and form-level error display using shadcn/ui error styling

#### 5. Navigation Header
- **Elements**: App title, Button component for Add action
- **Mobile**: Sticky header with touch-friendly Button sizes (44px minimum)
- **Accessibility**: Proper ARIA labels and keyboard navigation

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
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  required: ['id', 'title', 'date', 'createdAt', 'updatedAt'],
  indexes: ['date', 'createdAt']
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
    }, 'Please enter a valid date')
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
    date: ''
  }
});
```

### Date Calculations
```typescript
// Day difference calculation utility
export function calculateDayDifference(momentDate: string): {
  daysDifference: number;
  displayText: string;
} {
  const moment = new Date(momentDate);
  const today = new Date();
  
  // Reset time to compare dates only
  moment.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = moment.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let displayText: string;
  if (diffDays === 0) displayText = 'Today';
  else if (diffDays > 0) displayText = `${diffDays} days until`;
  else displayText = `${Math.abs(diffDays)} days ago`;
  
  return { daysDifference: diffDays, displayText };
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

### Tile Design with shadcn/ui Components
```typescript
// MomentTile component using shadcn/ui Card
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tileVariants = {
  past: "bg-muted text-muted-foreground",
  today: "bg-accent text-accent-foreground ring-2 ring-primary",
  future: "bg-primary text-primary-foreground"
};

// Component structure - Compact design
<Card className={cn("transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] cursor-pointer min-h-[100px]", tileVariants[status])}>
  <CardHeader className="pb-1 px-3 pt-3">
    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
      {title}
      {status === 'today' && <span className="ml-1">🎉</span>}
    </CardTitle>
  </CardHeader>
  <CardContent className="flex-1 px-3 py-1">
    {description && (
      <p className="text-xs leading-relaxed line-clamp-2">{description}</p>
    )}
  </CardContent>
  <CardFooter className="pt-1 pb-3 px-3">
    <p className="text-xs font-medium w-full text-center">{formattedDate}</p>
  </CardFooter>
</Card>

// Responsive grid classes - More columns for compact tiles
const gridClasses = "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-4";
```

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