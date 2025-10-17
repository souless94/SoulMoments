"use client"

import { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { AddEventForm } from "@/components/app/appCreateForm"
import { EventCard } from "@/components/app/appEventCard"
import { toast } from "sonner"

export interface AppEvent {
  id: string
  title: string
  date: string
  type: "event" | "anniversary"
  description?: string
  repeat?: "none" | "yearly"
}

// Stub for days remaining
function getDaysRemaining(dateStr: string) {
  const today = new Date()
  const eventDate = new Date(dateStr)
  const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 ? diff : 0
}

export default function HomePage() {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [bannerEvent, setBannerEvent] = useState<AppEvent | null>(null)
  const [activeSection, setActiveSection] = useState<"upcoming" | "all" | null>("upcoming")
  // Initialize events client-side to avoid hydration errors
  useEffect(() => {
    const initialEvents: AppEvent[] = [
      { id: crypto.randomUUID(), title: "Valentine's Day", date: "2026-02-14", type: "anniversary", repeat: "yearly", description: "Love is in the air ❤️" },
      { id: crypto.randomUUID(), title: "Project Launch", date: "2025-11-05", type: "event", repeat: "none", description: "Launch MVP version" },
      { id: crypto.randomUUID(), title: "Birthday - Alice", date: "2025-10-20", type: "event", repeat: "yearly" },
    ]
    setEvents(initialEvents)

    // Auto-select nearest upcoming event
    const now = new Date()
    const nearest = initialEvents
      .map(ev => {
        let eventDate = new Date(ev.date)
        if (ev.repeat === "yearly") {
          eventDate.setFullYear(now.getFullYear())
          if (eventDate < now) eventDate.setFullYear(now.getFullYear() + 1)
        }
        return { ...ev, nextDate: eventDate }
      })
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())[0]
    if (nearest) setBannerEvent(nearest)
  }, [])

  const handleAdd = (event: Omit<AppEvent, "id">) => {
    setEvents(prev => [...prev, { ...event, id: crypto.randomUUID() }])
  }

  const handleDelete = (id: string) => {
  // Find the event being deleted
  const deletedEvent = events.find(e => e.id === id)
  if (!deletedEvent) return

  // Optimistically remove
  setEvents(prev => prev.filter(e => e.id !== id))
  if (bannerEvent?.id === id) setBannerEvent(null)

  // Show toast with Undo option
  toast("Event deleted", {
    description: `"${deletedEvent.title}" has been removed.`,
    action: {
      label: "Undo",
      onClick: () => {
        setEvents(prev => [...prev, deletedEvent])
        toast.success("Event restored")
      },
    },
    duration: 4000, // 4s timeout before it's finalized
  })
}
  // Upcoming events: this month + next month
  const now = new Date()
  const thisMonth = now.getMonth()
  const nextMonth = (thisMonth + 1) % 12

  const upcoming = events
    .map(event => {
      let eventDate = new Date(event.date)
      if (event.repeat === "yearly") {
        eventDate.setFullYear(now.getFullYear())
        if (eventDate < now) eventDate.setFullYear(now.getFullYear() + 1)
      }
      return { ...event, nextDate: eventDate }
    })
    .filter(event => {
      const month = event.nextDate.getMonth()
      return month === thisMonth || month === nextMonth
    })
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto relative">
      {/* Banner */}
      {bannerEvent && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white text-center font-bold">
          {bannerEvent.title} is in {getDaysRemaining(bannerEvent.date)} {getDaysRemaining(bannerEvent.date) === 1 ? "day" : "days"}!
        </div>
      )}

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-2">Upcoming Events</h2>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-3">
            {upcoming.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isActive={activeSection === "upcoming" && bannerEvent?.id === event.id}
                onClick={() => {
                  setActiveSection("upcoming")
                  setBannerEvent(event) 
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Events */}
      <section>
        <h2 className="text-xl font-bold mb-2">All Events</h2>
        <Separator className="my-2" />
        <div className="grid grid-cols-2 gap-3">
          {sortedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isActive={activeSection === "all" && bannerEvent?.id === event.id}
              onClick={() => {
                  setActiveSection("all")
                  setBannerEvent(event) 
                }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>

      {/* Floating Add Event Button + Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Plus size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>Fill in details to add a new event</DialogDescription>
          </DialogHeader>
          <AddEventForm onAdd={handleAdd} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
