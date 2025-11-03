"use client";

import React from "react";
import { toast } from "sonner";

import dynamic from "next/dynamic";
import { Header } from "./components/Header";
import { MomentGrid } from "./components/MomentGrid";
import { MomentBanner } from "./components/MomentBanner";
import { FloatingAddButton } from "./components/FloatingAddButton";
import type { Moment, MomentFormData, MomentDocument } from "@/types/moment";
import { useMomentsDB } from "@/hooks/useMoment";
import { generateId, initDB } from "@/lib/moments-db";
import { WelcomeBanner } from "./components/WelcomeBanner";

// Code split the modal component since it's only used when user clicks add/edit
const MomentModal = dynamic(() => import("./components/MomentModal").then(mod => ({ default: mod.MomentModal })), {
  ssr: false,
  loading: () => null, // No loading spinner needed for modal
});

export default function Home() {
  const {
    moments,
    loading: dbLoading,
    error: dbError,
  } = useMomentsDB();

  // Modal & focused states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMoment, setEditingMoment] = React.useState<Moment | null>(null);
  const [focusedMoment, setFocusedMoment] = React.useState<Moment | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Add / Edit / Delete handlers - memoized to prevent unnecessary re-renders
  const handleAddMoment = React.useCallback(() => {
    setEditingMoment(null);
    setIsModalOpen(true);
  }, []);
  
  const handleMomentClick = React.useCallback((moment: Moment) => {
    setFocusedMoment(moment);
  }, []);
  
  const handleMomentEdit = React.useCallback((moment: Moment) => {
    setEditingMoment(moment);
    setIsModalOpen(true);
  }, []);

  const handleMomentDelete = React.useCallback(async (moment: Moment) => {
    try {
      const db = await initDB();
      const doc = await db.moments.findOne(moment.id).exec();
      if (doc) await doc.remove();
      toast.error("Moment deleted successfully");
      
      // Clear focused moment if it was the deleted one
      if (focusedMoment?.id === moment.id) setFocusedMoment(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete moment");
    }
  }, [focusedMoment?.id]);

  const handleFormSubmit = React.useCallback(async (data: MomentFormData) => {
    setIsLoading(true);
    try {
      const db = await initDB();

      if (editingMoment) {
        const doc = await db.moments.findOne(editingMoment.id).exec();
        if (doc) {
          await doc.update({
            $set: {
              title: data.title.trim(),
              description: data.description?.trim() || undefined,
              date: data.date,
              repeatFrequency: data.repeatFrequency || "none",
              updatedAt: new Date().toISOString(),
            },
          });
          toast.success("Moment updated successfully");
        }
      } else {
        const now = new Date().toISOString();
        await db.moments.insert({
          id: generateId(),
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          date: data.date,
          repeatFrequency: data.repeatFrequency || "none",
          createdAt: now,
          updatedAt: now,
        } as MomentDocument);
        toast.success("Moment created successfully");
      }

      setIsModalOpen(false);
      setEditingMoment(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save moment");
    } finally {
      setIsLoading(false);
    }
  }, [editingMoment]);

  if (dbLoading) return <LoadingScreen />;
  if (dbError) return <ErrorScreen error={dbError} />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WelcomeBanner/>
      <main className="container mx-auto py-8 pb-24">
        {moments.length > 0 && (
          <div className="mb-6 px-4">
            <h2 className="text-2xl font-semibold mb-2">Your Moments</h2>
            <p className="text-muted-foreground">
              Track your important life events and see how time flows.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {moments.length} moment{moments.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
        )}

        

        <MomentBanner moments={moments} focusedMoment={focusedMoment} />

        <MomentGrid
          moments={moments}
          onMomentClick={handleMomentClick}
          onMomentEdit={handleMomentEdit}
          onMomentDelete={handleMomentDelete}
        />

        <FloatingAddButton onClick={handleAddMoment} />

        <MomentModal
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) setEditingMoment(null);
            setIsModalOpen(open);
          }}
          onSubmit={handleFormSubmit}
          editingMoment={editingMoment}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

// --- Loading & Error screens ---
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">
          Connecting to database...
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-destructive mb-2 text-2xl">⚠️</div>
        <h3 className="font-semibold mb-2">Database Connection Error</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
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