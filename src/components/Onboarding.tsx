import { useStore } from '../storage/StoreContext'

/** First-launch gate: start fresh or load 30-day demo data. */
export default function Onboarding() {
  const { onboardFresh, onboardDemo } = useStore()
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl">
          ⟁
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Command Center</h1>
        <p className="mt-2 text-zinc-400">
          Your private transformation dashboard. No login, no cloud — everything stays on this device.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={onboardFresh} className="btn-primary py-4 text-base">
          Start fresh
        </button>
        <button onClick={onboardDemo} className="btn-ghost py-4 text-base">
          Load 30-day demo data
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500">
        Demo data is fully removable later. You can change every goal in Settings.
      </p>
    </div>
  )
}
