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

const MOBILE_TABS: { id: HeaderTab | 'input'; icon: string; label: string }[] = [
  { id: 'compare',   icon: '🧬', label: 'Compare'   },
  { id: 'single',    icon: '🔬', label: 'Single'    },
  { id: 'analyze',   icon: '📊', label: 'Analyze'   },
  { id: 'workflows', icon: '⚙️', label: 'Workflows' },
  { id: 'input',     icon: '✏️', label: 'Input'     },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<HeaderTab>('compare')
  const [inputModalOpen, setInputModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const tick = usePlayback((s) => s.tick)
  const initDefaultState = usePlayback((s) => s.initDefaultState)

  useAnimationFrame(tick, isPlaying)

  useEffect(() => {
    initDefaultState()
  }, [initDefaultState])

  const handleMobileTab = (id: HeaderTab | 'input') => {
    if (id === 'input') {
      setInputModalOpen(true)
    } else {
      setActiveTab(id as HeaderTab)
      setSidebarOpen(false)
    }
  }

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

            <aside className={`ag-col-right${sidebarOpen ? ' mobile-open' : ''}`}>
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

            <aside className={`ag-col-right${sidebarOpen ? ' mobile-open' : ''}`}>
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

            <aside className={`ag-col-right${sidebarOpen ? ' mobile-open' : ''}`}>
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

            <aside className={`ag-col-right${sidebarOpen ? ' mobile-open' : ''}`}>
              <RightSidebar />
            </aside>
          </>
        )}
      </main>

      {/* ── MOBILE FLOATING ACTION BUTTON — AI Agent ── */}
      <button
        className="ag-mobile-agent-fab"
        onClick={() => setSidebarOpen((o) => !o)}
        title="AI Agent"
        aria-label="Toggle AI Agent panel"
      >
        {sidebarOpen ? '✕' : '💬'}
      </button>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav className="ag-mobile-bottom-nav" aria-label="Mobile navigation">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ag-mobile-nav-btn${activeTab === (tab.id as HeaderTab) && tab.id !== 'input' ? ' active' : ''}`}
            onClick={() => handleMobileTab(tab.id)}
            aria-label={tab.label}
          >
            <span className="mob-icon">{tab.icon}</span>
            <span className="mob-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Global Sequence Input Modal — accessible from header from any tab */}
      <SequenceInputModal open={inputModalOpen} onClose={() => setInputModalOpen(false)} />
    </div>
  )
}
