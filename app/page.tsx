'use client';

import React from 'react';

import { Header } from './components/Header';
import { MomentGrid } from './components/MomentGrid';
import { MomentBanner } from './components/MomentBanner';
import { MomentModal } from './components/MomentModal';
import { FloatingAddButton } from './components/FloatingAddButton';
import { calculateDayDifference } from '@/lib/date-utils';
import type { Moment, MomentFormData } from '@/types/moment';

/**
 * Helper function to convert raw moment data to full Moment objects with calculated fields
 */
function enrichMomentWithCalculations(moment: Omit<Moment, 'daysDifference' | 'displayText' | 'status' | 'nextOccurrence' | 'isRepeating'>): Moment {
  const { daysDifference, displayText, status, nextOccurrence, isRepeating } = calculateDayDifference(moment.date, moment.repeatFrequency);
  return {
    ...moment,
    daysDifference,
    displayText,
    status,
    nextOccurrence,
    isRepeating
  };
}

export default function Home() {
  // Initialize with empty moments array - will be replaced by database integration
  const [moments, setMoments] = React.useState<Moment[]>([]);
  
  // Modal state - using React Hook Form approach
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMoment, setEditingMoment] = React.useState<Moment | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Banner focused moment state
  const [focusedMoment, setFocusedMoment] = React.useState<Moment | null>(null);

  // Update day calculations when component mounts or date changes
  React.useEffect(() => {
    const updateDayCalculations = () => {
      setMoments(currentMoments => 
        currentMoments.map(moment => {
          const { daysDifference, displayText, status, nextOccurrence, isRepeating } = calculateDayDifference(moment.date, moment.repeatFrequency);
          return {
            ...moment,
            daysDifference,
            displayText,
            status,
            nextOccurrence,
            isRepeating
          };
        })
      );
    };

    // Update immediately
    updateDayCalculations();

    // Update daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      updateDayCalculations();
      // Set up daily interval after first midnight update
      const intervalId = setInterval(updateDayCalculations, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => clearTimeout(timeoutId);
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

  // Handle delete button click
  // TODO: Replace with database operations in task 6.2
  const handleMomentDelete = (moment: Moment) => {
    // Temporary implementation - will be replaced by database operations
    setMoments(currentMoments => 
      currentMoments.filter(m => m.id !== moment.id)
    );
    
    // Clear focused moment if it was deleted
    if (focusedMoment?.id === moment.id) {
      setFocusedMoment(null);
    }
  };

  // Handle form submission (create/update only)
  // TODO: Replace with database operations in task 6.2
  const handleFormSubmit = async (data: MomentFormData) => {
    setIsLoading(true);

    try {
      // Temporary implementation - will be replaced by database operations
      if (editingMoment) {
        // Edit existing moment
        const updatedMoment = enrichMomentWithCalculations({
          ...editingMoment,
          title: data.title,
          description: data.description,
          date: data.date,
          repeatFrequency: data.repeatFrequency,
          updatedAt: Date.now()
        });
        
        setMoments(currentMoments =>
          currentMoments.map(moment =>
            moment.id === editingMoment.id ? updatedMoment : moment
          )
        );
        
        // Update focused moment if it was the edited one
        if (focusedMoment?.id === editingMoment.id) {
          setFocusedMoment(updatedMoment);
        }
      } else {
        // Add new moment
        const newMoment = enrichMomentWithCalculations({
          id: Date.now().toString(),
          title: data.title,
          description: data.description,
          date: data.date,
          repeatFrequency: data.repeatFrequency,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        
        setMoments(currentMoments => [...currentMoments, newMoment]);
      }

      // Close modal and reset state
      setIsModalOpen(false);
      setEditingMoment(null);
    } catch (error) {
      console.error('Error processing moment:', error);
      // TODO: Add proper error handling with user feedback
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
