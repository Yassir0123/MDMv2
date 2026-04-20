import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const padDateTimePart = (value: number) => value.toString().padStart(2, "0")

const normalizeDateTimeInput = (value: string) =>
  value
    .trim()
    .replace(" ", "T")
    .replace(/\.(\d{3})\d+/, ".$1")
    .replace(/\.(\d{1,2})(?!\d)/, ".$10")

export function getDateTimeSortValue(value?: string | number | Date | null) {
  if (!value) return 0

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime()
  }

  const date = new Date(typeof value === "string" ? normalizeDateTimeInput(value) : value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

export function formatDateTimeValue(
  value?: string | number | Date | null,
  fallback = "-",
) {
  if (!value) return fallback

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback
    return `${value.getFullYear()}-${padDateTimePart(value.getMonth() + 1)}-${padDateTimePart(value.getDate())} ${padDateTimePart(value.getHours())}:${padDateTimePart(value.getMinutes())}:${padDateTimePart(value.getSeconds())}`
  }

  const raw = String(value).trim()
  if (!raw) return fallback

  const date = new Date(typeof value === "string" ? normalizeDateTimeInput(raw) : value)
  if (Number.isNaN(date.getTime())) {
    return raw.replace("T", " ").replace(/\.\d+/, "")
  }

  return `${date.getFullYear()}-${padDateTimePart(date.getMonth() + 1)}-${padDateTimePart(date.getDate())} ${padDateTimePart(date.getHours())}:${padDateTimePart(date.getMinutes())}:${padDateTimePart(date.getSeconds())}`
}
