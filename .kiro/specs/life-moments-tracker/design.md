# Design Document

## Overview

The Life Moments Tracker is a Progressive Web App (PWA) that provides a simple, tile-based interface for tracking important life events. The application uses modern web technologies to deliver a native-like mobile experience while maintaining full offline functionality through local storage and service workers.

## Architecture

### Technology Stack
- **Frontend Framework**: Next.js 15+ (App Router) with React 19+ for modern development experience
- **Styling**: Tailwind CSS for utility-first responsive design and mobile optimization
- **Database**: RxDB with Dexie.js storage adapter for reactive offline-first data management
- **PWA Features**: Next.js built-in PWA support with next-pwa plugin for service workers and manifest
- **TypeScript**: Full TypeScript support for type safety and better development experience

### Application Structure
```
src/
├── app/
│   ├── layout.tsx         # Root layout with PWA configuration
│   ├── page.tsx          # Main moments grid page
│   ├── globals.css       # Global Tailwind CSS imports
│   └── components/
│       ├── MomentTile.tsx    # Individual moment tile component
│       ├── MomentGrid.tsx    # Responsive grid container
│       ├── AddMomentModal.tsx # Add/edit moment modal
│       └── Header.tsx        # Navigation header
├── lib/
│   ├── database.ts       # RxDB database setup and configuration
│   ├── schemas.ts        # RxDB schemas and types
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
  date: string;         // ISO date string (YYYY-MM-DD)
  createdAt: number;    // Unix timestamp
  updatedAt: number;    // Unix timestamp
}

// TypeScript interface for components
export interface Moment extends MomentDocument {
  daysDifference: number;  // Calculated field
  displayText: string;     // "X days ago" / "X days until" / "Today"
}
```

### Core Components

#### 1. Tile Component
- **Purpose**: Visual representation of a single moment
- **Layout**: Card-based design with title, date, and day count
- **States**: Past events (muted colors), future events (bright colors), today (highlighted)
- **Interactions**: Tap to edit/delete, long press for context menu

#### 2. Tile Grid
- **Layout**: CSS Grid with responsive columns (1 on mobile, 2-3 on tablet, 3-4 on desktop)
- **Sorting**: Chronological order with upcoming events first, then past events
- **Performance**: Virtual scrolling for large collections (100+ moments)

#### 3. Add/Edit Modal
- **Fields**: Title input (text), Date picker (native HTML5 date input)
- **Validation**: Required title, valid date selection
- **Mobile UX**: Full-screen modal on mobile, centered dialog on desktop

#### 4. Navigation Header
- **Elements**: App title, Add button, Settings menu
- **Mobile**: Sticky header with touch-friendly button sizes (44px minimum)

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

### Visual Design System
- **Color Palette**: 
  - Primary: #6366f1 (indigo)
  - Secondary: #8b5cf6 (purple)
  - Success: #10b981 (emerald)
  - Warning: #f59e0b (amber)
  - Neutral: #6b7280 (gray)
- **Typography**: System font stack for optimal performance
- **Spacing**: 8px base unit with consistent spacing scale
- **Border Radius**: 12px for cards, 8px for buttons

### Tile Design with Tailwind CSS
```typescript
// MomentTile component styling classes
const tileClasses = {
  base: "rounded-xl p-5 shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
  past: "bg-gradient-to-br from-gray-400 to-gray-600 text-white",
  today: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white ring-2 ring-emerald-300",
  future: "bg-gradient-to-br from-indigo-400 to-purple-600 text-white"
};

// Responsive grid classes
const gridClasses = "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4";
```

### Responsive Breakpoints
- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2-3 columns)
- **Desktop**: > 1024px (3-4 columns)

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