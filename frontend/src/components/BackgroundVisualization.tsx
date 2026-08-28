/**
 * Subtle animated biological background.
 * Bright scientific DNA-inspired geometry at very low opacity — subordinate to data.
 */
export default function BackgroundVisualization() {
  return (
    <div className="bio-background">
      <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* ── Gradient wash: warm white to cool white ── */}
        <defs>
          <linearGradient id="bg-wash" x1="0" y1="0" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0f4ff" />
            <stop offset="50%" stopColor="#fafbfd" />
            <stop offset="100%" stopColor="#f5f0ff" />
          </linearGradient>
          <linearGradient id="helix-a" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b6cf5" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3b6cf5" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="helix-b" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Full-page subtle gradient wash */}
        <rect width="1440" height="900" fill="url(#bg-wash)" />

        {/* ── Helix strand 1 (upper) ── */}
        <path
          d="M-100,200 C200,100 400,300 600,200 C800,100 1000,300 1200,200 C1400,100 1600,300 1800,200"
          stroke="url(#helix-a)"
          strokeWidth="2"
          fill="none"
        >
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values="
              M-100,200 C200,100 400,300 600,200 C800,100 1000,300 1200,200 C1400,100 1600,300 1800,200;
              M-100,220 C200,120 400,280 600,220 C800,120 1000,280 1200,220 C1400,120 1600,280 1800,220;
              M-100,200 C200,100 400,300 600,200 C800,100 1000,300 1200,200 C1400,100 1600,300 1800,200
            "
          />
        </path>

        {/* ── Helix strand 2 (upper, complementary) ── */}
        <path
          d="M-100,220 C200,320 400,120 600,220 C800,320 1000,120 1200,220 C1400,320 1600,120 1800,220"
          stroke="url(#helix-b)"
          strokeWidth="2"
          fill="none"
        >
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values="
              M-100,220 C200,320 400,120 600,220 C800,320 1000,120 1200,220 C1400,320 1600,120 1800,220;
              M-100,200 C200,300 400,140 600,200 C800,300 1000,140 1200,200 C1400,300 1600,140 1800,200;
              M-100,220 C200,320 400,120 600,220 C800,320 1000,120 1200,220 C1400,320 1600,120 1800,220
            "
          />
        </path>

        {/* ── Base pair rungs (upper helix) ── */}
        {[150, 300, 450, 600, 750, 900, 1050, 1200, 1350].map((x, i) => (
          <line
            key={`rung-${i}`}
            x1={x}
            y1={190 + Math.sin(i * 0.8) * 15}
            x2={x}
            y2={230 - Math.sin(i * 0.8) * 15}
            stroke="#3b6cf5"
            strokeWidth="1"
            opacity={0.06 + Math.sin(i * 0.5) * 0.03}
          />
        ))}

        {/* ── Second helix (lower) ── */}
        <path
          d="M-100,600 C200,500 400,700 600,600 C800,500 1000,700 1200,600 C1400,500 1600,700 1800,600"
          stroke="url(#helix-a)"
          strokeWidth="1.5"
          fill="none"
        >
          <animate
            attributeName="d"
            dur="25s"
            repeatCount="indefinite"
            values="
              M-100,600 C200,500 400,700 600,600 C800,500 1000,700 1200,600 C1400,500 1600,700 1800,600;
              M-100,620 C200,520 400,680 600,620 C800,520 1000,680 1200,620 C1400,520 1600,680 1800,620;
              M-100,600 C200,500 400,700 600,600 C800,500 1000,700 1200,600 C1400,500 1600,700 1800,600
            "
          />
        </path>

        <path
          d="M-100,620 C200,720 400,520 600,620 C800,720 1000,520 1200,620 C1400,720 1600,520 1800,620"
          stroke="url(#helix-b)"
          strokeWidth="1.5"
          fill="none"
        >
          <animate
            attributeName="d"
            dur="25s"
            repeatCount="indefinite"
            values="
              M-100,620 C200,720 400,520 600,620 C800,720 1000,520 1200,620 C1400,720 1600,520 1800,620;
              M-100,600 C200,700 400,540 600,600 C800,700 1000,540 1200,600 C1400,700 1600,540 1800,600;
              M-100,620 C200,720 400,520 600,620 C800,720 1000,520 1200,620 C1400,720 1600,520 1800,620
            "
          />
        </path>

        {/* ── Base pair rungs (lower helix) ── */}
        {[200, 400, 600, 800, 1000, 1200].map((x, i) => (
          <line
            key={`rung2-${i}`}
            x1={x}
            y1={590 + Math.sin(i * 1.1) * 12}
            x2={x}
            y2={630 - Math.sin(i * 1.1) * 12}
            stroke="#8b5cf6"
            strokeWidth="0.8"
            opacity={0.05 + Math.sin(i * 0.7) * 0.02}
          />
        ))}

        {/* ── Nucleotide symbols scattered ── */}
        {['A', 'C', 'G', 'T', 'A', 'G', 'C', 'T', 'A', 'C', 'G', 'T'].map((base, i) => {
          const colors = { A: '#ef4444', C: '#3b82f6', G: '#22c55e', T: '#f59e0b' }
          return (
            <text
              key={`base-${i}`}
              x={80 + i * 115}
              y={420 + Math.sin(i * 0.9) * 180}
              fill={colors[base as keyof typeof colors]}
              fontSize="16"
              fontFamily="monospace"
              fontWeight="700"
              opacity={0.06 + Math.sin(i * 0.6) * 0.02}
            >
              {base}
            </text>
          )
        })}

        {/* ── Floating molecular dots ── */}
        {[...Array(12)].map((_, i) => (
          <circle
            key={`dot-${i}`}
            cx={120 + i * 110}
            cy={300 + Math.sin(i * 1.3) * 200}
            r={2 + Math.sin(i) * 1}
            fill="#3b6cf5"
            opacity={0.04 + Math.sin(i * 0.8) * 0.02}
          >
            <animate
              attributeName="cy"
              dur={`${18 + i * 2}s`}
              repeatCount="indefinite"
              values={`${300 + Math.sin(i * 1.3) * 200};${320 + Math.sin(i * 1.3) * 200};${300 + Math.sin(i * 1.3) * 200}`}
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}
