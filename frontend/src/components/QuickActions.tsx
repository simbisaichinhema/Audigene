import { useRef } from 'react'
import { usePlayback } from '../state/usePlayback'

export default function QuickActions() {
  const { initDefaultState, sequence, loadTimeline, loadComparisonTimeline, method } = usePlayback()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── PASTE FROM CLIPBOARD ──────────────────────────────────
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return
      const clean = text.trim()
      // Detect FASTA vs raw
      if (clean.startsWith('>')) {
        const lines = clean.split('\n')
        const seq = lines.filter(l => !l.startsWith('>')).join('')
        loadTimeline(seq, method)
      } else {
        loadTimeline(clean.replace(/[^ATGCatgcNnRrYyKkMmSsWwBbDdHhVv]/g, ''), method)
      }
    } catch {
      alert('Clipboard read failed — please allow clipboard access or paste manually in the Input panel.')
    }
  }

  // ── LOAD .fasta / .txt FILE ────────────────────────────────
  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || ''
      // Try to parse as multi-FASTA (Gene A = first entry, Gene B = second)
      const records = text.split('>').filter(Boolean)
      if (records.length >= 2) {
        const seqA = records[0].split('\n').slice(1).join('').toUpperCase()
        const seqB = records[1].split('\n').slice(1).join('').toUpperCase()
        loadTimeline(seqA, method)
        loadComparisonTimeline(seqB)
      } else {
        const seqA = records[0]?.split('\n').slice(1).join('').toUpperCase() || text.replace(/\s/g, '').toUpperCase()
        loadTimeline(seqA, method)
      }
    }
    reader.readAsText(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  // ── CLEAN SEQUENCE ─────────────────────────────────────────
  const handleClean = () => {
    const cleanedA = sequence.replace(/[^ATGCNatgcn]/g, '').toUpperCase()
    loadTimeline(cleanedA, method)
  }

  // ── EXPORT REPORT ─────────────────────────────────────────
  const handleExport = () => {
    const { differences, alignment } = usePlayback.getState()
    const lines = [
      '# AudiGene Analysis Report',
      `Date: ${new Date().toISOString()}`,
      '',
      '## Sequence Stats',
      `Reference Length: ${sequence.length} bp`,
      `Alignment Identity: ${alignment ? (alignment.identity * 100).toFixed(1) : 'N/A'}%`,
      `Matches: ${alignment?.matchCount ?? 'N/A'} | Mismatches: ${alignment?.mismatchCount ?? 'N/A'}`,
      '',
      '## Detected Variants',
      ...differences.map(d => `  - Position ${d.position}: ${d.referenceBase} → ${d.sampleBase} [${d.type}]`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'audigene-report.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const actions = [
    {
      label: 'EXAMPLE DATA',
      icon: '📊',
      desc: 'Load HbS vs Normal',
      cls: 'btn-blue',
      onClick: initDefaultState,
    },
    {
      label: 'PASTE SEQUENCE',
      icon: '📋',
      desc: 'From clipboard',
      cls: 'btn-teal',
      onClick: handlePaste,
    },
    {
      label: 'LOAD FILE',
      icon: '📂',
      desc: '.fasta / .txt',
      cls: 'btn-orange',
      onClick: () => fileInputRef.current?.click(),
    },
    {
      label: 'CLEAN SEQUENCE',
      icon: '🧹',
      desc: 'Strip invalid chars',
      cls: 'btn-pink',
      onClick: handleClean,
    },
    {
      label: 'EXPORT REPORT',
      icon: '💾',
      desc: 'Download .txt',
      cls: 'btn-violet',
      onClick: handleExport,
    },
    {
      label: 'RESET ALL',
      icon: '🔄',
      desc: 'Restore defaults',
      cls: 'btn-slate',
      onClick: initDefaultState,
    },
  ]

  return (
    <div className="ag-quick-actions-card">
      <input
        ref={fileInputRef}
        type="file"
        accept=".fasta,.fa,.txt"
        style={{ display: 'none' }}
        onChange={handleFileLoad}
      />
      <div className="ag-section-label">QUICK ACTIONS</div>
      <div className="ag-quick-grid ag-quick-grid-3">
        {actions.map((a) => (
          <button
            key={a.label}
            className={`ag-qa-btn ${a.cls}`}
            onClick={a.onClick}
            title={a.desc}
          >
            <span className="qa-icon">{a.icon}</span>
            <span className="qa-label">{a.label}</span>
            <span className="qa-desc">{a.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
