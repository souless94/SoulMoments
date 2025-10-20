'use client';

import React from 'react';

import { Header } from './components/Header';
import { MomentGrid } from './components/MomentGrid';
import { MomentBanner } from './components/MomentBanner';
import { MomentModal } from './components/MomentModal';
import { FloatingAddButton } from './components/FloatingAddButton';
import { initDB, generateId } from '@/lib/moments-db';
import { calculateDayDifference } from '@/lib/date-utils';
import { toast } from 'sonner';
import type { Moment, MomentFormData, MomentDocument } from '@/types/moment';

export default function Home() {
  // State
  const [moments, setMoments] = React.useState<Moment[]>([]);
  const [dbLoading, setDbLoading] = React.useState(true);
  const [dbError, setDbError] = React.useState<string | null>(null);
  
  // Modal state - using React Hook Form approach
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMoment, setEditingMoment] = React.useState<Moment | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Banner focused moment state
  const [focusedMoment, setFocusedMoment] = React.useState<Moment | null>(null);

  // Initialize database and set up reactive query (following RxDB quickstart pattern)
  React.useEffect(() => {
    let subscription: any = null;

    const init = async () => {
      try {
        setDbLoading(true);
        setDbError(null);
        
        // Initialize database
        const db = await initDB();
        console.log('Database initialized successfully');
        
        // Set up reactive query following RxDB quickstart pattern
        const observable = db.moments.find({
          selector: {},
          sort: [{ createdAt: 'desc' }]
        }).$;
        
        subscription = observable.subscribe((docs: any) => {
          console.log('Currently have ' + docs.length + ' moments');
          
          // Transform documents to UI-ready moments
          const processedMoments = docs.map((doc: any) => {
            const data = doc.toJSON() as MomentDocument;
            const calculation = calculateDayDifference(data.date, data.repeatFrequency);
            
            return {
              ...data,
              ...calculation,
              isRepeating: data.repeatFrequency !== 'none',
            } as Moment;
          });
          
          setMoments(processedMoments);
        });
          
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error.message : 'Failed to initialize database');
      } finally {
        setDbLoading(false);
      }
    };

    init();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Handle opening add modal
  const handleAddMoment = () => {
    setEditingMoment(null);
    setIsModalOpen(true);
  };

  // Handle moment tile click (for banner countdown change)
  const handleMomentClick = (moment: Moment) => {
    setFocusedMoment(moment);
  };

  // Handle edit button click
  const handleMomentEdit = (moment: Moment) => {
    setEditingMoment(moment);
    setIsModalOpen(true);
  };

  // Handle delete button click with database operations and undo functionality
  const handleMomentDelete = (moment: Moment) => {
    // Show success toast with undo action
    toast.success(`"${moment.title}" deleted`, {
      action: {
        label: "Undo",
        onClick: () => {
          toast.success("Deletion cancelled");
        },
      },
      onDismiss: async () => {
        // Actually delete from database when toast is dismissed
        try {
          const db = await initDB();
          const doc = await db.moments.findOne(moment.id).exec();
          if (doc) {
            await doc.remove();
          }
        } catch (error) {
          console.error('Failed to delete moment:', error);
          toast.error('Failed to delete moment');
        }
      },
      duration: 5000,
    });

    // Clear focused moment if it was deleted
    if (focusedMoment?.id === moment.id) {
      setFocusedMoment(null);
    }
  };

  // Handle form submission (create/update only) with database operations
  const handleFormSubmit = async (data: MomentFormData) => {
    setIsLoading(true);

    try {
      const db = await initDB();
      
      if (editingMoment) {
        // Update existing moment
        const doc = await db.moments.findOne(editingMoment.id).exec();
        if (doc) {
          await doc.update({
            $set: {
              title: data.title.trim(),
              description: data.description?.trim() || undefined,
              date: data.date,
              repeatFrequency: data.repeatFrequency || 'none',
              updatedAt: new Date().toISOString(),
            }
          });
          toast.success("Moment updated successfully");
        }
      } else {
        // Create new moment
        const now = new Date().toISOString();
        const momentData: MomentDocument = {
          id: generateId(),
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          date: data.date,
          repeatFrequency: data.repeatFrequency || 'none',
          createdAt: now,
          updatedAt: now,
        };

        await db.moments.insert(momentData);
        toast.success("Moment created successfully");
      }

      // Close modal and reset state
      setIsModalOpen(false);
      setEditingMoment(null);
    } catch (error) {
      console.error("Error processing moment:", error);
      toast.error("Failed to save moment");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setEditingMoment(null);
    }
    setIsModalOpen(open);
  };

  // Show database loading state
  if (dbLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Connecting to database...</p>
        </div>
      </div>
    );
  }

  // Show database error state
  if (dbError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-2 text-2xl">⚠️</div>
          <h3 className="font-semibold mb-2">Database Connection Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 pb-24"> {/* Add bottom padding for floating button */}
        {moments.length > 0 && (
          <div className="mb-6 px-4">
            <h2 className="text-2xl font-semibold mb-2">Your Moments</h2>
            <p className="text-muted-foreground">
              Track your important life events and see how time flows. Click on any moment to edit or delete it.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {moments.length} moment{moments.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
        )}

        {/* Banner showing moment highlights */}
        <div className="px-4">
          <MomentBanner moments={moments} focusedMoment={focusedMoment} />
        </div>
        
        <MomentGrid
          moments={moments}
          onMomentClick={handleMomentClick}
          onMomentEdit={handleMomentEdit}
          onMomentDelete={handleMomentDelete}
        />

        {/* Floating Add Button */}
        <FloatingAddButton onClick={handleAddMoment} />

        {/* Add/Edit Modal */}
        <MomentModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onSubmit={handleFormSubmit}
          editingMoment={editingMoment}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
