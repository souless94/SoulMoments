// src/schemas/moments.schema.ts
import type { RxJsonSchema } from "rxdb";

export interface MomentDocument {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  repeatFrequency: "none" | "daily" | "weekly" | "monthly" | "yearly";
  createdAt: string; // ISO date-time string
  updatedAt: string; // ISO date-time string
}

export const momentSchema: RxJsonSchema<MomentDocument> = {
  keyCompression: true,
  title: "moment schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 36,
    },
    title: {
      type: "string",
      maxLength: 100,
    },
    description: {
      type: "string",
      maxLength: 200,
    },
    date: {
      type: "string",
      maxLength: 10, // YYYY-MM-DD
    },
    repeatFrequency: {
      type: "string",
      enum: ["none", "daily", "weekly", "monthly", "yearly"],
      default: "none",
      maxLength: 10,
    },
    createdAt: {
      type: "string",
      format: "date-time",
      maxLength: 50,
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      maxLength: 50,
    },
  },
  required: [
    "id",
    "title",
    "date",
    "repeatFrequency",
    "createdAt",
    "updatedAt",
  ],
  indexes: [
    "date",
    "createdAt",
    "repeatFrequency",
    ["repeatFrequency", "date"], // Compound index
  ],
};
