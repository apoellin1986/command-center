import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import SupplementsView from './habits/SupplementsView'
import PushupsView from './habits/PushupsView'
import DisciplineView from './habits/DisciplineView'
import FastingView from './habits/FastingView'

type Tab = 'supplements' | 'pushups' | 'fasting' | 'discipline'

export default function HabitsPage() {
  const [tab, setTab] = useState<Tab>('supplements')
  return (
    <div className="flex flex-col">
      <PageHeader title="Habits" subtitle="Supplements, push-ups, fasting & discipline" />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { label: 'Supplements', value: 'supplements' },
          { label: 'Push-ups', value: 'pushups' },
          { label: 'Fasting', value: 'fasting' },
          { label: 'Discipline', value: 'discipline' },
        ]}
      />
      {tab === 'supplements' && <SupplementsView />}
      {tab === 'pushups' && <PushupsView />}
      {tab === 'fasting' && <FastingView />}
      {tab === 'discipline' && <DisciplineView />}
    </div>
  )
}
