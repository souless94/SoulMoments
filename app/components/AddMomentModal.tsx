/**
 * MomentModal component with React Hook Form and Zod validation
 * Uses upsert approach - same interface for create and edit
 * Includes delete confirmation dialog for existing moments
 */

"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";
import { momentFormSchema, type MomentFormData } from "@/lib/validations";
import { getTodayDateString } from "@/lib/date-utils";
import type { Moment, AddMomentModalProps } from "@/types/moment";

/**
 * MomentModal component for upsert operations (create/edit)
 */
export function AddMomentModal({
  open,
  onOpenChange,
  onSubmit,
  editingMoment = null,
  isLoading = false,
}: AddMomentModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const hasExistingMoment = editingMoment !== null;

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<MomentFormData>({
    resolver: zodResolver(momentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: getTodayDateString(),
    },
  });

  // Reset form when modal opens - upsert approach
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: editingMoment?.title || "",
        description: editingMoment?.description || "",
        date: editingMoment?.date || getTodayDateString(),
      });
    }
  }, [open, editingMoment, form]);

  // Handle form submission - upsert approach
  const handleSubmit = (data: MomentFormData) => {
    onSubmit(data);
  };

  // Handle modal close
  const handleClose = () => {
    setShowDeleteConfirm(false);
    onOpenChange(false);
    // Reset form when closing
    setTimeout(() => {
      form.reset();
    }, 150); // Small delay to avoid visual glitch
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (editingMoment && onSubmit) {
      // Use a special flag to indicate deletion - we'll handle this in the parent component
      onSubmit({
        title: editingMoment.title,
        description: editingMoment.description,
        date: editingMoment.date,
        _delete: true,
      } as MomentFormData & { _delete: boolean });
    }
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Main Add/Edit Dialog */}
      <Dialog open={open && !showDeleteConfirm} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hasExistingMoment ? "Edit Moment" : "Add New Moment"}
            </DialogTitle>
            <DialogDescription>
              {hasExistingMoment
                ? "Update your moment details below."
                : "Create a new moment to track an important event or milestone."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Wedding Anniversary, Trip to Japan"
                {...form.register("title")}
                className={cn(
                  form.formState.errors.title &&
                    "border-destructive focus-visible:ring-destructive/20"
                )}
                aria-invalid={!!form.formState.errors.title}
                disabled={isLoading}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Input
                id="description"
                type="text"
                placeholder="e.g., A special celebration with family and friends"
                {...form.register("description")}
                className={cn(
                  form.formState.errors.description &&
                    "border-destructive focus-visible:ring-destructive/20"
                )}
                aria-invalid={!!form.formState.errors.description}
                disabled={isLoading}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
                className={cn(
                  form.formState.errors.date &&
                    "border-destructive focus-visible:ring-destructive/20"
                )}
                aria-invalid={!!form.formState.errors.date}
                disabled={isLoading}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              {/* Delete Button (only for existing moments) */}
              {hasExistingMoment && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="sm:mr-auto"
                >
                  Delete
                </Button>
              )}

              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>

              {/* Save Button - upsert approach */}
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Save Moment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Moment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{editingMoment?.title}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



/**
 * Demo component showing the upsert modal approach
 */
export function MomentModalDemo() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingMoment, setEditingMoment] = React.useState<Moment | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [moments, setMoments] = React.useState<Moment[]>([]);

  // Sample moment for edit demo
  const sampleMoment: Moment = {
    id: "1",
    title: "Wedding Anniversary",
    description: "Celebrating 5 years together",
    date: "2024-06-15",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    daysDifference: 0,
    displayText: "Today",
    status: "today",
  };

  const handleSubmit = async (data: MomentFormData) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Upsert submitted:", data);

    // Handle upsert logic
    const dataWithDelete = data as MomentFormData & { _delete?: boolean };
    if (!dataWithDelete._delete) {
      const momentData = {
        id: editingMoment?.id || Date.now().toString(),
        title: data.title,
        description: data.description,
        date: data.date,
        createdAt: editingMoment?.createdAt || Date.now(),
        updatedAt: Date.now(),
        daysDifference: 0,
        displayText: "Today",
        status: "today" as const,
      };
      
      if (editingMoment) {
        // Update existing
        setMoments((prev) => prev.map(m => m.id === editingMoment.id ? momentData : m));
      } else {
        // Create new
        setMoments((prev) => [...prev, momentData]);
      }
    }

    setIsLoading(false);
    setIsOpen(false);
    setEditingMoment(null);
  };

  const openCreateModal = () => {
    setEditingMoment(null);
    setIsOpen(true);
  };

  const openEditModal = () => {
    setEditingMoment(sampleMoment);
    setIsOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Moment Modal Demo (Upsert)</h2>
        <p className="text-muted-foreground">
          Same interface for create and edit - upsert approach with shadcn Loader.
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={openCreateModal}>Create Moment</Button>
        <Button variant="outline" onClick={openEditModal}>
          Edit Sample Moment
        </Button>
      </div>

      {moments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Moments:</h3>
          <ul className="space-y-1">
            {moments.map((moment) => (
              <li key={moment.id} className="text-sm text-muted-foreground">
                {moment.title} - {moment.date}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddMomentModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onSubmit={handleSubmit}
        editingMoment={editingMoment}
        isLoading={isLoading}
      />
    </div>
  );
}
