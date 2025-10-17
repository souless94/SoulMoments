"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { AppEvent } from "@/app/page"

// Zod schema
const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["event", "anniversary"]),
  description: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface AddEventFormProps {
  onAdd: (event: Omit<AppEvent, "id">) => void
}

export function AddEventForm({ onAdd }: AddEventFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: "",
      type: "event",
      description: "",
    },
  })

  const onSubmit = (data: EventFormData) => {
    onAdd(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border-2 border-accent rounded-2xl p-4 space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Event Title *</label>
        <Input placeholder="e.g., Birthday, Anniversary" {...register("title")} />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {/* Date & Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Date *</label>
          <Input type="date" {...register("date")} />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Type</label>
          <Select {...register("type")}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="anniversary">Anniversary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Description (optional)</label>
        <Input placeholder="Optional notes..." {...register("description")} />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full">
        Add Event
      </Button>
    </form>
  )
}
