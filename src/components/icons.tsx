// Minimal inline icon set. Icons support meaning but never carry it alone —
// every nav item and toggle also has a text label.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (props: P) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const IconToday = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
export const IconWeight = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a2 2 0 0 1 2 2H10a2 2 0 0 1 2-2Z" />
    <path d="M5 7h14l1.5 12.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" />
    <path d="M9 12l3-2 3 5" />
  </svg>
)
export const IconHabits = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)
export const IconFutsal = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7l3 2-1 4h-4l-1-4Z" />
  </svg>
)
export const IconReports = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 3v18h18" />
    <rect x="7" y="11" width="3" height="6" />
    <rect x="13" y="7" width="3" height="10" />
  </svg>
)
export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.74 1.05 1.39 1.13H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
)
export const IconFlame = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1-.5-2-1-3 2 1 4 4 4 7a8 8 0 1 1-16 0c0-3 2-5 3-7 1 2 2 2 3 1 .5-1 .5-2 0-4Z" />
  </svg>
)
export const IconDumbbell = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
  </svg>
)
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
)
export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="M9 18l6-6-6-6" /></svg>
)
export const IconClose = (p: P) => (
  <svg {...base(p)}><path d="M18 6L6 18M6 6l12 12" /></svg>
)
export const IconDrop = (p: P) => (
  <svg {...base(p)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>
)
export const IconCalendar = IconToday
