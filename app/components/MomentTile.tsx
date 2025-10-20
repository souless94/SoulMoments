/**
 * MomentTile component using shadcn/ui Card
 * Displays a single moment with title, day count, and date
 * Supports different visual states for past/today/future moments
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/date-utils";
import type { MomentTileProps } from "@/types/moment";

/**
 * Tile variant styles for different moment states
 */
const tileVariants = {
  past: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted/70",
  today:
    "bg-accent text-accent-foreground border-accent ring-2 ring-primary/20 hover:bg-accent/90",
  future: "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10",
} as const;

/**
 * MomentTile component that displays a single moment as a card
 */
export function MomentTile({
  moment,
  onClick,
  onEdit,
  onDelete,
}: MomentTileProps) {
  // Use the pre-calculated values from the moment object for consistency
  const { status } = moment;

  // Format the date for display - use next occurrence for repeat events
  const displayDate = moment.isRepeating && moment.nextOccurrence ? moment.nextOccurrence : moment.date;
  const formattedDate = formatDisplayDate(displayDate);
  const datePrefix = moment.isRepeating && moment.nextOccurrence ? "Next: " : "";

  // Handle tile click - for banner countdown change
  const handleClick = () => {
    if (onClick) {
      onClick(moment);
    }
  };

  // Handle edit button click
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tile click
    if (onEdit) {
      onEdit(moment);
    }
  };

  // Handle delete with undo toast and countdown
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tile click

    if (onDelete) {
      let isUndone = false;
      let countdown = 5;

      // Show initial toast
      const toastId = toast.success(`"${moment.title}" deleted`, {
        description: `Click undo to restore, or wait ${countdown} seconds to confirm deletion`,
        action: {
          label: "Undo",
          onClick: () => {
            isUndone = true;
            clearTimeout(deleteTimer);
            clearInterval(countdownInterval);
            toast.success("Deletion cancelled", {
              description: "Your moment has been restored",
            });
          },
        },
        duration: 5000, // Standard 5 second duration
      });

      // Update countdown every second
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0 && !isUndone) {
          toast.success(`"${moment.title}" deleted`, {
            id: toastId,
            description: `Click undo to restore, or wait ${countdown} seconds to confirm deletion`,
            action: {
              label: "Undo",
              onClick: () => {
                isUndone = true;
                clearTimeout(deleteTimer);
                clearInterval(countdownInterval);
                toast.success("Deletion cancelled", {
                  description: "Your moment has been restored",
                });
              },
            },
            duration: 5000,
          });
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Set up auto-delete timer (5 seconds)
      const deleteTimer = setTimeout(() => {
        if (!isUndone) {
          clearInterval(countdownInterval);
          toast.dismiss(toastId);
          onDelete(moment);
        }
      }, 5000);
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        // Base styles
        "transition-all duration-200 cursor-pointer select-none relative",
        // Hover effects
        "hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]",
        // Focus styles for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        // Shorter, more compact sizing
        "min-h-[80px] active:scale-[0.99]",
        // Variant-specific styles
        tileVariants[status]
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${moment.title}${
        moment.description ? `, ${moment.description}` : ""
      }, ${formattedDate}`}
    >
      {/* Delete button - top right (less likely to be clicked accidentally) */}
      <div className="absolute top-2 right-2">
        <Button
          size="sm"
          variant="destructive"
          className="h-6 w-6 p-0 opacity-80 hover:opacity-100"
          onClick={handleDelete}
          aria-label="Delete moment"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Edit button - bottom right (easier to access, less accidental clicks) */}
      <div className="absolute bottom-2 right-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-6 w-6 p-0 opacity-80 hover:opacity-100"
          onClick={handleEdit}
          aria-label="Edit moment"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>

      <CardHeader className="pb-1 px-3 pt-2">
        <CardTitle
          className={cn(
            "text-sm font-semibold leading-tight line-clamp-1 pr-16 flex items-center gap-1", // Single line for shorter tiles
            status === "today" && "text-accent-foreground",
            status === "future" && "text-primary",
            status === "past" && "text-muted-foreground"
          )}
        >
          <span className="flex-1 truncate">{moment.title}</span>
          {moment.isRepeating && (
            <Repeat className={cn(
              "h-3 w-3 flex-shrink-0",
              status === "today" && "text-accent-foreground opacity-80",
              status === "future" && "text-primary opacity-80",
              status === "past" && "text-muted-foreground opacity-60"
            )} />
          )}
          {status === "today" && <span className="flex-shrink-0">🎉</span>}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 px-3 py-0">
        {moment.description && (
          <p
            className={cn(
              "text-xs leading-tight line-clamp-1", // Single line for shorter tiles
              status === "today" && "text-accent-foreground/80",
              status === "future" && "text-primary/80",
              status === "past" && "text-muted-foreground/80"
            )}
          >
            {moment.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-1 pb-2 px-3">
        <p
          className={cn(
            "text-xs font-medium w-full text-center",
            status === "today" && "text-accent-foreground/70",
            status === "future" && "text-primary/70",
            status === "past" && "text-muted-foreground/70"
          )}
        >
          {datePrefix}{formattedDate}
        </p>
      </CardFooter>
    </Card>
  );
}


