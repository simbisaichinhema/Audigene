import { useState } from 'react'
import RightSidebarEventInspector from './RightSidebarEventInspector'
import RightSidebarAiAgent from './RightSidebarAiAgent'
import LlmSetupPanel from './LlmSetupPanel'
import { usePlayback } from '../state/usePlayback'

type Tab = 'inspector' | 'agent' | 'setup'

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('agent')
  const isPlaying = usePlayback((s) => s.isPlaying)

  return (
    <div className="ag-card ag-right-sidebar-prominent" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>

      {/* ── Bright Header: Agentic Orchestrator Title & Status ── */}
      <div style={{
        background: '#ffffff',
        padding: '12px 14px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%',
            background: isPlaying ? '#10b981' : '#64748b',
            boxShadow: isPlaying ? '0 0 0 3px rgba(16,185,129,0.25)' : 'none',
            animation: isPlaying ? 'pulseGreen 1.2s infinite' : 'none',
          }} />
          <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#0f172a', letterSpacing: '0.03em' }}>
            AGENTIC ORCHESTRATOR
          </span>
        </div>

        {/* Live Audio Volume Meter Pulse Indicator */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 3,
          height: 18, padding: '2px 6px', borderRadius: 6,
          background: '#f1f5f9', border: '1px solid #e2e8f0',
        }} title="Sonification Audio Meter">
          <span style={{
            width: 3, borderRadius: 2, background: isPlaying ? '#2563eb' : '#cbd5e1',
            height: isPlaying ? '80%' : '30%', transition: 'height 0.1s ease',
            animation: isPlaying ? 'meterJump1 0.3s infinite alternate' : 'none'
          }} />
          <span style={{
            width: 3, borderRadius: 2, background: isPlaying ? '#10b981' : '#cbd5e1',
            height: isPlaying ? '100%' : '40%', transition: 'height 0.1s ease',
            animation: isPlaying ? 'meterJump2 0.25s infinite alternate' : 'none'
          }} />
          <span style={{
            width: 3, borderRadius: 2, background: isPlaying ? '#f59e0b' : '#cbd5e1',
            height: isPlaying ? '60%' : '20%', transition: 'height 0.1s ease',
            animation: isPlaying ? 'meterJump3 0.35s infinite alternate' : 'none'
          }} />
          <span style={{
            width: 3, borderRadius: 2, background: isPlaying ? '#ef4444' : '#cbd5e1',
            height: isPlaying ? '90%' : '25%', transition: 'height 0.1s ease',
            animation: isPlaying ? 'meterJump4 0.28s infinite alternate' : 'none'
          }} />
        </div>
      </div>

      {/* ── 3-Tab Switcher: AI Agent, Inspector, Key Setup ── */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: '#f8fafc',
        padding: '6px 8px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <button
          onClick={() => setActiveTab('agent')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 8px', borderRadius: 8, cursor: 'pointer',
            background: activeTab === 'agent' ? '#ffffff' : 'transparent',
            border: activeTab === 'agent' ? '1px solid #cbd5e1' : '1px solid transparent',
            color: activeTab === 'agent' ? '#2563eb' : '#64748b',
            fontWeight: 800, fontSize: '0.68rem',
            boxShadow: activeTab === 'agent' ? '0 2px 5px rgba(0,0,0,0.04)' : 'none',
          }}
        >
          <span>💬</span> AI Agent
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 8px', borderRadius: 8, cursor: 'pointer',
            background: activeTab === 'inspector' ? '#ffffff' : 'transparent',
            border: activeTab === 'inspector' ? '1px solid #cbd5e1' : '1px solid transparent',
            color: activeTab === 'inspector' ? '#0f172a' : '#64748b',
            fontWeight: 800, fontSize: '0.68rem',
            boxShadow: activeTab === 'inspector' ? '0 2px 5px rgba(0,0,0,0.04)' : 'none',
          }}
        >
          <span>📑</span> Inspector
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 8px', borderRadius: 8, cursor: 'pointer',
            background: activeTab === 'setup' ? '#ffffff' : 'transparent',
            border: activeTab === 'setup' ? '1px solid #cbd5e1' : '1px solid transparent',
            color: activeTab === 'setup' ? '#7c3aed' : '#64748b',
            fontWeight: 800, fontSize: '0.68rem',
            boxShadow: activeTab === 'setup' ? '0 2px 5px rgba(0,0,0,0.04)' : 'none',
          }}
        >
          <span>⚙️</span> Key Setup
        </button>
      </div>

      {/* ── Tab Content Pane ── */}
      <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', background: '#ffffff' }}>
        {activeTab === 'agent' && <RightSidebarAiAgent />}
        {activeTab === 'inspector' && <RightSidebarEventInspector />}
        {activeTab === 'setup' && <LlmSetupPanel />}
      </div>

      <style>{`
        @keyframes pulseGreen {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes meterJump1 { 0% { height: 30%; } 100% { height: 95%; } }
        @keyframes meterJump2 { 0% { height: 40%; } 100% { height: 100%; } }
        @keyframes meterJump3 { 0% { height: 20%; } 100% { height: 75%; } }
        @keyframes meterJump4 { 0% { height: 25%; } 100% { height: 85%; } }
      `}</style>
    </div>
  )
}
