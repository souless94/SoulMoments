'use client';

import React from 'react';

import { Header } from './components/Header';
import { MomentGrid } from './components/MomentGrid';
import { MomentBanner } from './components/MomentBanner';
import { AddMomentModal } from './components/AddMomentModal';
import { FloatingAddButton } from './components/FloatingAddButton';
import { calculateDayDifference } from '@/lib/date-utils';
import type { Moment, MomentFormData } from '@/types/moment';

// Sample data to demonstrate all UI states
const SAMPLE_MOMENTS: Omit<Moment, 'daysDifference' | 'displayText' | 'status' | 'nextOccurrence' | 'isRepeating'>[] = [
  {
    id: '1',
    title: 'Wedding Anniversary',
    description: 'Celebrating 5 years of marriage with a romantic dinner',
    date: new Date().toISOString().split('T')[0], // Today
    repeatFrequency: 'yearly', // Anniversary repeats yearly
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    id: '2',
    title: 'Trip to Japan',
    description: 'Two weeks exploring Tokyo, Kyoto, and Mount Fuji',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    repeatFrequency: 'none',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    id: '3',
    title: 'Started New Job',
    description: 'First day as Senior Developer at TechCorp',
    date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    repeatFrequency: 'none',
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    id: '4',
    title: 'Birthday Party',
    description: 'Surprise party with friends and family',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    repeatFrequency: 'yearly', // Birthday repeats yearly
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    id: '5',
    title: 'Graduation Day',
    description: 'Received my Master\'s degree in Computer Science',
    date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    repeatFrequency: 'none',
    createdAt: Date.now() - 400 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    id: '6',
    title: 'Summer Vacation',
    description: 'Beach house rental with college friends',
    date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days from now
    repeatFrequency: 'none',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    id: '7',
    title: 'First Date',
    description: 'Coffee at the local bookstore cafe',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    repeatFrequency: 'none',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  },
  {
    id: '8',
    title: 'Marathon Race',
    description: 'First attempt at running a full 26.2 miles',
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
    repeatFrequency: 'none',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  }
];

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
  // Local state for moments
  const [moments, setMoments] = React.useState<Moment[]>(() => 
    SAMPLE_MOMENTS.map(enrichMomentWithCalculations)
  );
  
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
  const handleMomentDelete = (moment: Moment) => {
    setMoments(currentMoments => 
      currentMoments.filter(m => m.id !== moment.id)
    );
    
    // Clear focused moment if it was deleted
    if (focusedMoment?.id === moment.id) {
      setFocusedMoment(null);
    }
  };

  // Handle form submission (create/update only)
  const handleFormSubmit = async (data: MomentFormData) => {
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

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
        
        console.log('Updated moment:', updatedMoment.title);
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
        console.log('Added new moment:', newMoment.title);
      }

      // Close modal and reset state
      setIsModalOpen(false);
      setEditingMoment(null);
    } catch (error) {
      console.error('Error processing moment:', error);
      // In a real app, you'd show an error message to the user
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
        <div className="mb-6 px-4">
          <h2 className="text-2xl font-semibold mb-2">Your Moments</h2>
          <p className="text-muted-foreground">
            Track your important life events and see how time flows. Click on any moment to edit or delete it.
          </p>
          {moments.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {moments.length} moment{moments.length !== 1 ? 's' : ''} tracked
            </p>
          )}
        </div>

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
        <AddMomentModal
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
