"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Trash2, Heart, Flower2 } from "lucide-react"
import type { AppEvent } from "@/app/page"

interface EventCardProps {
  event: AppEvent
  isActive?: boolean
  onClick?: () => void
  onDelete?: (id: string) => void
}

export function EventCard({ event, isActive = false, onClick, onDelete }: EventCardProps) {
  // Gradient based on title
  const gradients = [
    "bg-gradient-to-br from-pink-300 via-pink-400 to-rose-500",
    "bg-gradient-to-br from-purple-300 via-pink-400 to-rose-500",
    "bg-gradient-to-br from-rose-300 via-pink-500 to-purple-400",
    "bg-gradient-to-br from-pink-400 via-purple-400 to-rose-500",
  ]
  const gradientClass = gradients[event.title.length % gradients.length]

  // Icon
  const icon = event.type === "anniversary"
    ? <Heart className="w-4 h-4 text-pink-500" />
    : <Flower2 className="w-4 h-4 text-purple-500" />

  return (
    <Card
      onClick={onClick}
      className={`
        relative p-3 text-white cursor-pointer transition-transform duration-300 transform hover:scale-105 hover:shadow-lg
        ${gradientClass}
        ${isActive ? "scale-110 shadow-lg" : "hover:scale-105 hover:shadow-md"}
      `}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(event.id) }}
          className="absolute top-1 right-1 text-white/80 hover:text-red-400 p-2 rounded-full"
        >
          <Trash2 size={18} />
        </button>
      )}

      {/* Icon */}
      <div className="flex items-center mb-1 space-x-1">{icon}</div>

      {/* Title */}
      <h3 className="text-sm font-bold line-clamp-2">{event.title}</h3>

      {/* Date */}
      <p className="text-xs">{new Date(event.date).toLocaleDateString()}</p>

      {/* Optional description */}
      {event.description && <p className="text-xs mt-1 line-clamp-2">{event.description}</p>}
    </Card>
  )
}
