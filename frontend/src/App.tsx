import { useEffect, useState } from 'react'
import { usePlayback } from './state/usePlayback'
import { useAnimationFrame } from './hooks/useAnimationFrame'
import Header, { type HeaderTab } from './components/Header'
import SequenceAlignment from './components/SequenceAlignment'
import FrequencyGraph from './components/FrequencyGraph'
import PlaybackControlsBar from './components/PlaybackControlsBar'
import RightSidebar from './components/RightSidebar'
import DynamicMusicBackground from './components/DynamicMusicBackground'
import WorkflowPipeline from './components/WorkflowPipeline'
import WhyPanel from './components/WhyPanel'
import LlmSetupPanel from './components/LlmSetupPanel'
import EventTimeline from './components/EventTimeline'
import SequenceInputModal from './components/SequenceInputModal'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<HeaderTab>('compare')
  const [inputModalOpen, setInputModalOpen] = useState(false)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const tick = usePlayback((s) => s.tick)
  const initDefaultState = usePlayback((s) => s.initDefaultState)

  useAnimationFrame(tick, isPlaying)

  useEffect(() => {
    initDefaultState()
  }, [initDefaultState])

  return (
    <div className="ag-app-wrapper">
      <DynamicMusicBackground />
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInputOpen={() => setInputModalOpen(true)}
      />

      <main className="ag-main-layout">
        {activeTab === 'compare' && (
          <>
            <section className="ag-col-center">
              <div className="ag-red-guide-line" />
              <SequenceAlignment />
              <FrequencyGraph />
              
              {/* Compact spacing to ensure full viewport fit without scrolling */}
              <div style={{ marginTop: 14 }}>
                <PlaybackControlsBar />
              </div>
            </section>

            <aside className="ag-col-right">
              <RightSidebar />
            </aside>
          </>
        )}

        {activeTab === 'single' && (
          <>
            <aside className="ag-col-left">
              <LlmSetupPanel />
            </aside>

            <section className="ag-col-center">
              <div className="ag-red-guide-line" />
              <SequenceAlignment />
              <FrequencyGraph />
              
              <div style={{ marginTop: 24 }}>
                <PlaybackControlsBar />
              </div>
            </section>

            <aside className="ag-col-right">
              <RightSidebar />
            </aside>
          </>
        )}

        {activeTab === 'analyze' && (
          <>
            <aside className="ag-col-left">
              <WhyPanel />
            </aside>

            <section className="ag-col-center">
              <div className="ag-red-guide-line" />
              <SequenceAlignment />
              <EventTimeline />
              <FrequencyGraph />
              
              <div style={{ marginTop: 24 }}>
                <PlaybackControlsBar />
              </div>
            </section>

            <aside className="ag-col-right">
              <RightSidebar />
            </aside>
          </>
        )}

        {activeTab === 'workflows' && (
          <>
            <aside className="ag-col-left">
              <LlmSetupPanel />
            </aside>

            <section className="ag-col-center">
              <WorkflowPipeline />
              <SequenceAlignment />
              
              <div style={{ marginTop: 24 }}>
                <PlaybackControlsBar />
              </div>
            </section>

            <aside className="ag-col-right">
              <RightSidebar />
            </aside>
          </>
        )}
      </main>

      {/* Global Sequence Input Modal — accessible from header from any tab */}
      <SequenceInputModal open={inputModalOpen} onClose={() => setInputModalOpen(false)} />
    </div>
  )
}
