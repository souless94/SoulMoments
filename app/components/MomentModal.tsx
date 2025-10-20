/**
 * MomentModal component with React Hook Form and Zod validation
 * Uses upsert approach - same interface for create and edit
 * Modal handles both create and update operations
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import { cn } from "@/lib/utils";
import { momentFormSchema, type MomentFormData } from "@/lib/validations";
import { getTodayDateString } from "@/lib/date-utils";
import type { MomentModalProps, RepeatFrequency } from "@/types/moment";

/**
 * MomentModal component for upsert operations (create/edit)
 */
export function MomentModal({
  open,
  onOpenChange,
  onSubmit,
  editingMoment = null,
  isLoading = false,
}: MomentModalProps) {
  const hasExistingMoment = editingMoment !== null;

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<MomentFormData>({
    resolver: zodResolver(momentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: getTodayDateString(),
      repeatFrequency: "none",
    },
  });

  // Reset form when modal opens - upsert approach
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: editingMoment?.title || "",
        description: editingMoment?.description || "",
        date: editingMoment?.date || getTodayDateString(),
        repeatFrequency: editingMoment?.repeatFrequency ?? "none",
      });
    }
  }, [open, editingMoment, form]);

  // Handle form submission - upsert approach
  const handleSubmit = (data: MomentFormData) => {
    onSubmit(data);
  };

  // Handle modal close
  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    setTimeout(() => {
      form.reset();
    }, 150); // Small delay to avoid visual glitch
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

          {/* Repeat Frequency Select */}
          <div className="space-y-2">
            <Label htmlFor="repeatFrequency" className="text-sm font-medium">
              Repeat
            </Label>
            <Select
              value={form.watch("repeatFrequency")}
              onValueChange={(value: RepeatFrequency) =>
                form.setValue("repeatFrequency", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select repeat frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">
                  Yearly (anniversaries, birthdays)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
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
                  <Spinner className="mr-2 h-4 w-4" />
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
  );
}