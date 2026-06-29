import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import FutsalView from './futsal/FutsalView'
import WorkoutsView from './futsal/WorkoutsView'

type Tab = 'futsal' | 'workouts'

export default function FutsalPage() {
  const [tab, setTab] = useState<Tab>('futsal')
  return (
    <div className="flex flex-col">
      <PageHeader title="Training" subtitle="Futsal & home workouts" />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { label: 'Futsal', value: 'futsal' },
          { label: 'Workouts', value: 'workouts' },
        ]}
      />
      {tab === 'futsal' ? <FutsalView /> : <WorkoutsView />}
    </div>
  )
}
