import { useState } from 'react'
import Spectrum from './Spectrum'
import Waveform from './Waveform'

export default function AudioVisualizer() {
  const [activeTab, setActiveTab] = useState<'spectrum' | 'waveform'>('spectrum')

  return (
    <div className="ag-card ag-audio-viz-card">
      <div className="ag-card-header">
        <div className="ag-card-title">
          <span className="ag-badge badge-blue">4</span>
          <span>LIVE AUDIO SPECTRUM (FFT) & WAVEFORM</span>
        </div>
        <div className="viz-tabs">
          <button
            className={`viz-tab-btn ${activeTab === 'spectrum' ? 'active' : ''}`}
            onClick={() => setActiveTab('spectrum')}
          >
            📊 SPECTRUM (LIVE FFT)
          </button>
          <button
            className={`viz-tab-btn ${activeTab === 'waveform' ? 'active' : ''}`}
            onClick={() => setActiveTab('waveform')}
          >
            〰 WAVEFORM
          </button>
        </div>
      </div>

      <div className="viz-tab-content">
        {activeTab === 'spectrum' ? <Spectrum /> : <Waveform />}
      </div>
    </div>
  )
}
