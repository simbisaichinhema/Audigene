import { usePlayback } from '../state/usePlayback'
import { NUCLEOTIDE_MAP } from '../bioinformatics/sequenceUtils'

export default function RightSidebarEventInspector() {
  const { sequence, comparisonSequence, activePosition, differences } = usePlayback()

  const refBase = sequence[activePosition - 1] || 'A'
  const sampleBase = comparisonSequence[activePosition - 1] || refBase

  const diffMatch = differences.find((d) => d.position === activePosition)
  const eventType = diffMatch ? diffMatch.type.toUpperCase() : 'MATCH'

  const mapInfo = NUCLEOTIDE_MAP[sampleBase] || { pitch: 'C4', freq: 262.0 }

  return (
    <div className="ag-inspector-inner">
      <div className="ag-inspector-grid">
        <div className="grid-row">
          <span className="row-label">Position</span>
          <span className="row-value val-pos">{activePosition}</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Reference (A)</span>
          <span className="row-value val-ref">{refBase}</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Sample (B)</span>
          <span className="row-value val-sample">{sampleBase}</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Event Type</span>
          <span className="row-value val-event">{eventType}</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Sonification Method</span>
          <span className="row-value">Nucleotide Chroma</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Pitch</span>
          <span className="row-value">{mapInfo.pitch}</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Frequency</span>
          <span className="row-value">{mapInfo.freq} Hz</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Duration</span>
          <span className="row-value">200 ms</span>
        </div>

        <div className="grid-row">
          <span className="row-label">Provenance</span>
          <span className="row-value val-provenance">PAPER_EXACT</span>
        </div>
      </div>

      <button className="ag-details-btn">DETAILS ∨</button>
    </div>
  )
}
