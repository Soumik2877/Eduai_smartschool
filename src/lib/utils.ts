import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function daysUntil(date: string | Date) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const SUBJECT_COLORS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626',
  '#7C3AED', '#DB2777', '#0284C7', '#65A30D', '#EA580C',
]

export const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  first_study: { label: 'First Study', icon: '📚', color: 'bg-blue-100 text-blue-800' },
  streak_7: { label: '7-Day Streak', icon: '🔥', color: 'bg-orange-100 text-orange-800' },
  streak_30: { label: '30-Day Streak', icon: '⚡', color: 'bg-yellow-100 text-yellow-800' },
  quiz_master: { label: 'Quiz Master', icon: '🏆', color: 'bg-purple-100 text-purple-800' },
  perfect_score: { label: 'Perfect Score', icon: '💯', color: 'bg-green-100 text-green-800' },
  focus_100h: { label: '100h Focus', icon: '🎯', color: 'bg-teal-100 text-teal-800' },
  early_bird: { label: 'Early Bird', icon: '🌅', color: 'bg-pink-100 text-pink-800' },
}
