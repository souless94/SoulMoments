# Implementation Plan

- [x] 1. Set up Next.js project structure and basic configuration

  - Configure Next.js for PWA support with service worker and manifest
  - Install and configure shadcn/ui with Tailwind CSS
  - Set up essential UI components (Button, Card, Dialog, Input, Label)
  - Install React Hook Form and Zod for form management and validation
  - Configure TypeScript and project structure
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Build all UI components with static data (UI-first approach)

  - [x] 2.1 Create validation schemas and date utilities

    - Create enhanced Zod validation schema for moment form (title, description, date validation)
    - Set up TypeScript types using Zod inference with optional description field
    - Create utility functions for date calculations
    - Implement "X days ago", "X days until", "Today" logic
    - Test edge cases (leap years, timezone handling)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 4.2, 4.3_

  - [x] 2.2 Build compact moment tile component using shadcn/ui Card

    - Build compact MomentTile component using Card, CardHeader, CardContent, CardFooter
    - Implement smaller tile design optimized for mobile viewing (2 columns on mobile)
    - Display title with today emoji, description in content, and date in footer
    - Implement tile variants for different states (past/today/future) using shadcn/ui classes
    - Add subtle hover effects and mobile touch interactions with proper accessibility
    - Use cn() utility for conditional styling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 2.2, 3.1_

  - [x] 2.3 Build responsive grid layout with compact design

    - Create MomentGrid component with Tailwind CSS Grid layout
    - Implement responsive breakpoints (2 col mobile, 3-4 tablet, 5-6 desktop)
    - Use tighter spacing (gap-3) for more compact layout
    - Test grid behavior with various screen sizes and compact tiles
    - _Requirements: 2.1, 2.2, 2.3, 5.1_

  - [x] 2.4 Build responsive header component with shadcn/ui Button

    - Create Header component with app title and shadcn/ui Button for add action
    - Implement mobile-friendly navigation with proper touch targets
    - Use shadcn/ui design tokens and CSS variables
    - Add proper ARIA labels for accessibility
    - _Requirements: 2.2, 3.1, 3.4_

  - [x] 2.5 Create complete add/edit moment dialog form with React Hook Form

    - Build AddMomentModal using Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
    - Integrate React Hook Form with useForm hook and enhanced Zod resolver
    - Use shadcn/ui Input and Label components for title, description, and date fields
    - Implement real-time validation with enhanced Zod schema and error display
    - Add form submission handling with proper loading states
    - Include edit mode functionality with pre-filled data using form.reset()
    - Add delete confirmation dialog with destructive Button variant
    - Test form validation, submission, and error handling on mobile and desktop
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 2.2, 3.4_

  - [x] 2.6 Create moment banner component for key information display

    - Build MomentBanner component to show moment highlights at top of page
    - Display today's moments with celebration emoji and styling
    - Show next upcoming moment and most recent past moment
    - Include summary statistics (upcoming count, past count)
    - Use gradient background and responsive layout
    - Hide banner when no moments exist (empty state)
    - _Requirements: 5.1, 5.2, 5.3, 2.1, 2.2_

-

- [x] 3. Create complete static demo with full UI functionality

  - [x] 3.1 Build main page with sample data and working UI

    - Build main page component that renders header, banner, and grid
    - Add comprehensive sample moment data with descriptions to demonstrate all UI states
    - Connect all UI components with local state management (React Hook Form approach)
    - Implement add, edit, delete functionality with local state and React Hook Form
    - Connect form submission to local state updates with description support
    - Integrate MomentBanner component to show key moment information
    - Test form validation and error handling with sample data
    - Test responsive behavior across all devices with compact tile layout
    - Verify all UI interactions work without database
    - _Requirements: 2.1, 2.2, 3.1, 5.1, 4.1, 6.1, 6.2, 6.3_

- [x] 3.5. App UI Refinement and UX Improvements

  - [x] 3.5.1 Implement advanced tile interactions with hover actions

    - Add edit and delete icon buttons that appear on tile hover
    - Position action buttons in top-right corner with proper spacing
    - Implement event propagation handling to prevent tile click conflicts
    - Use Lucide icons (Edit, Trash2) with shadcn/ui Button components
    - Add smooth opacity transitions for button visibility
    - Test touch interactions on mobile devices
    - _Requirements: 2.2, 3.1, 6.1, 6.2_

  - [x] 3.5.2 Enhance delete functionality with Sonner toast and undo

    - Integrate Sonner toast library for modern notification system
    - Add Toaster component to root layout for global toast management
    - Implement delete with undo functionality using toast actions
    - Provide 5-second window for users to cancel deletion
    - Remove delete confirmation dialogs in favor of undo toast
    - Handle toast dismiss events to confirm final deletion
    - _Requirements: 6.1, 6.2, 6.3, 3.1_

  - [x] 3.5.3 Refactor modal to upsert-only approach

    - Remove delete functionality from modal to simplify interface
    - Focus modal on create and update operations only
    - Maintain upsert approach with single "Save Moment" button
    - Use shadcn/ui Spinner component for loading states
    - Simplify modal state management and form handling
    - Test modal behavior for both create and edit modes
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2_

  - [x] 3.5.4 Implement dynamic banner with focused moment display

    - Add focused moment state to banner component
    - Enable tile click to focus moment in banner (separate from edit)
    - Display focused moment with visual highlight (ring border)
    - Show focused moment's countdown, title, and description
    - Maintain default banner behavior when no moment is focused
    - Update focused moment when edited, clear when deleted
    - _Requirements: 5.1, 5.2, 5.3, 2.1, 2.2_

  - [x] 3.5.5 Separate tile interaction behaviors

    - Implement distinct click behaviors for different actions:
      - Tile click → Focus moment in banner (countdown change)
      - Edit button → Open modal for editing
      - Delete button → Immediate delete with undo toast
    - Add proper event handling to prevent interaction conflicts
    - Ensure accessibility with proper ARIA labels and keyboard navigation
    - Test all interaction patterns on mobile and desktop
    - _Requirements: 2.2, 3.1, 3.4, 6.1, 6.2_

- [ ] 4. Set up RxDB database and data layer

  - [ ] 4.1 Configure RxDB with Dexie.js storage

    - Install and configure RxDB with Dexie.js adapter
    - Create database schema for moments collection
    - Set up database initialization and connection
    - Add proper TypeScript interfaces for database operations
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 4.2 Create database service layer

    - Build database service with CRUD operations
    - Implement reactive queries for real-time updates
    - Add error handling for database operations
    - Create custom React hooks for database interactions
    - _Requirements: 1.1, 1.2, 4.4, 6.5_

  - [ ] 4.3 Write unit tests for database operations

    - Create tests for CRUD operations
    - Test reactive query behavior
    - Mock RxDB for isolated testing
    - Test error handling scenarios
    - _Requirements: 1.1, 4.4, 6.5_

- [ ] 5. Connect UI to database (replace local state with persistent storage)

  - [ ] 5.1 Replace local state with database queries

    - Connect MomentGrid to RxDB reactive queries
    - Replace sample data and local state with real database
    - Implement loading states for data fetching
    - Test real-time updates when data changes
    - _Requirements: 1.1, 1.4, 5.1, 5.5_

  - [ ] 5.2 Connect form functionality to database

    - Connect AddMomentModal to database create/update operations
    - Connect delete functionality to database delete operations
    - Add proper error handling for database operations
    - Implement success feedback for all operations
    - Test offline functionality with database persistence
    - _Requirements: 1.1, 4.1, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Enhance PWA features and add polish

  - [ ] 6.1 Enhance PWA configuration and icons

    - Create proper PWA icons in multiple sizes (192x192, 256x256, 384x384, 512x512)
    - Update manifest.json with complete metadata
    - Test PWA installation on mobile devices
    - Verify service worker caching strategies
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 6.2 Test and optimize offline functionality

    - Verify all features work without internet connection
    - Test data persistence across browser sessions
    - Optimize caching strategies for best performance
    - Add offline status indicators to UI using shadcn/ui components
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 6.3 Add comprehensive error handling
    - Implement error boundaries for React components
    - Add user-friendly error messages using shadcn/ui Alert components
    - Create fallback UI for error states
    - Test error scenarios and recovery
    - _Requirements: 1.5, 6.5_

- [ ] 7. Final optimization and testing

  - [ ] 7.1 Optimize performance and bundle size

    - Implement code splitting for modal components using dynamic imports
    - Optimize shadcn/ui and Tailwind CSS bundle size
    - Add React performance optimizations (useMemo, useCallback)
    - Test performance with large datasets and virtual scrolling if needed
    - _Requirements: 2.2, 3.2, 3.4_

  - [ ] 7.2 Enhance mobile user experience

    - Fine-tune touch interactions and gestures
    - Optimize keyboard behavior on mobile
    - Test across different mobile browsers
    - Ensure proper viewport handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 7.3 Add accessibility improvements (leveraging shadcn/ui accessibility)

    - Verify shadcn/ui components have proper ARIA labels and roles
    - Ensure keyboard navigation works throughout app using Radix UI primitives
    - Test with screen readers to validate shadcn/ui accessibility features
    - Verify color contrast meets WCAG standards with shadcn/ui theme
    - _Requirements: 3.3, 3.5_

  - [ ] 7.4 Create end-to-end tests

    - Write E2E tests for core user flows
    - Test PWA installation and offline functionality
    - Verify cross-browser compatibility
    - Test mobile device functionality
    - _Requirements: All requirements validation_
