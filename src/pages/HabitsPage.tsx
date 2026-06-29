import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import SupplementsView from './habits/SupplementsView'
import PushupsView from './habits/PushupsView'
import DisciplineView from './habits/DisciplineView'

type Tab = 'supplements' | 'pushups' | 'discipline'

export default function HabitsPage() {
  const [tab, setTab] = useState<Tab>('supplements')
  return (
    <div className="flex flex-col">
      <PageHeader title="Habits" subtitle="Supplements, push-ups & discipline" />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { label: 'Supplements', value: 'supplements' },
          { label: 'Push-ups', value: 'pushups' },
          { label: 'Discipline', value: 'discipline' },
        ]}
      />
      {tab === 'supplements' && <SupplementsView />}
      {tab === 'pushups' && <PushupsView />}
      {tab === 'discipline' && <DisciplineView />}
    </div>
  )
}
