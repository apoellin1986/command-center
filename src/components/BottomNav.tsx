import { NavLink } from 'react-router-dom'
import {
  IconFutsal,
  IconHabits,
  IconReports,
  IconSettings,
  IconToday,
  IconWeight,
} from './icons'

const items = [
  { to: '/', label: 'Today', Icon: IconToday, end: true },
  { to: '/weight', label: 'Weight', Icon: IconWeight },
  { to: '/habits', label: 'Habits', Icon: IconHabits },
  { to: '/futsal', label: 'Futsal', Icon: IconFutsal },
  { to: '/reports', label: 'Reports', Icon: IconReports },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-base-600 bg-base-800/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-6">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            <Icon width={22} height={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
