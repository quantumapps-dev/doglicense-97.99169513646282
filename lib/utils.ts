import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------- Number Helpers ----------
export function parseNumberSafe(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  if (trimmed === "") return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

export function isPositiveNumber(val: unknown): boolean {
  const n = parseNumberSafe(val)
  return n !== null && n > 0
}

export function isIntegerNumber(val: unknown): boolean {
  const n = parseNumberSafe(val)
  return n !== null && Number.isInteger(n)
}

// Use in Zod refinements where you accept string inputs but need a number
export function coerceNumberOrFail(input: unknown): number {
  const n = parseNumberSafe(input)
  if (n === null) {
    throw new Error("Invalid number")
  }
  return n
}

// Optional min/max guard you can call inside refinements
export function inRange(n: number, min: number, max: number): boolean {
  return n >= min && n <= max
}

// ---------- Date Helpers ----------
export function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime())
}

export function coerceDate(input: unknown): Date | null {
  if (input instanceof Date) return isValidDate(input) ? input : null
  if (typeof input === "string") {
    // HTML date inputs provide "YYYY-MM-DD"
    // Construct as local date without timezone shift
    const parts = input.split("-")
    if (parts.length === 3) {
      const [yStr, mStr, dStr] = parts
      const y = Number(yStr)
      const m = Number(mStr)
      const d = Number(dStr)
      if (
        Number.isInteger(y) &&
        Number.isInteger(m) &&
        Number.isInteger(d) &&
        y > 1900 &&
        m >= 1 &&
        m <= 12 &&
        d >= 1 &&
        d <= 31
      ) {
        const dt = new Date(y, m - 1, d)
        // Validate components round-trip
        if (
          dt.getFullYear() === y &&
          dt.getMonth() === m - 1 &&
          dt.getDate() === d
        ) {
          return dt
        }
      }
      return null
    }
    // Fallback parse for other strings
    const dt = new Date(input)
    return isValidDate(dt) ? dt : null
  }
  return null
}

export function isNotFuture(date: Date): boolean {
  const today = new Date()
  // Normalize to date precision (ignore time)
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const b = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  return a.getTime() <= b.getTime()
}

export function isWithinYears(date: Date, years: number): boolean {
  const today = new Date()
  const cutoff = new Date(
    today.getFullYear() - years,
    today.getMonth(),
    today.getDate()
  )
  return date.getTime() >= cutoff.getTime()
}

export function toISODateStringLocal(date: Date): string {
  // Returns "YYYY-MM-DD" in local time (handy for saving or displaying)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ---------- US Phone Helpers (no regex) ----------
export function keepDigits(input: string): string {
  let out = ""
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    // '0'..'9'
    if (c >= 48 && c <= 57) out += input[i]
  }
  return out
}

// E.164-ish minimal US rule: 10 digits, area code cannot start with 0 or 1
export function isValidUSPhoneDigits(digits: string): boolean {
  if (digits.length !== 10) return false
  const first = digits.charCodeAt(0) - 48 // '0' => 0
  return first >= 2 && first <= 9
}

export function sanitizeUSPhone(input: unknown): {
  ok: boolean
  digits: string
  message?: string
} {
  if (typeof input !== "string") {
    return { ok: false, digits: "", message: "Phone must be a string" }
  }
  const digits = keepDigits(input)
  if (!isValidUSPhoneDigits(digits)) {
    return {
      ok: false,
      digits,
      message:
        "Enter a valid US phone number (10 digits; area code cannot start with 0 or 1)",
    }
  }
  return { ok: true, digits }
}

// Format for display "(XXX) XXX-XXXX"
export function formatUSPhone(digits: string): string {
  if (digits.length !== 10) return digits
  const a = digits.slice(0, 3)
  const b = digits.slice(3, 6)
  const c = digits.slice(6)
  return `(${a}) ${b}-${c}`
}
