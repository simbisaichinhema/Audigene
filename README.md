# 🧬 AudiGene: Agentic Genomic Sonification & Variant Orchestrator

[![Bioinformatics Platform](https://img.shields.io/badge/Platform-Bioinformatics-blue.svg)](https://github.com/simbisaichinhema/Audigene)
[![WebAudio API](https://img.shields.io/badge/Sonification-WebAudio--API-emerald.svg)]()
[![AI Agent Ready](https://img.shields.io/badge/LLM-Agentic--Orchestrator-violet.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**AudiGene** is an academic-grade bioinformatics web platform designed for visual, acoustic (sonification), and AI-agentic analysis of DNA sequences and genomic variants. Based on peer-reviewed pitch mapping methodologies (Temple 2017), AudiGene transforms nucleotide sequences into harmonic audio contours and real-time interactive frequency graphs, allowing researchers to **listen to genetic mutations** and query genomic variants using an integrated AI Agent Orchestrator.

---

## 🏆 Project Credits & Authors

> 🎉 **Created for Agentic Day Celebration**  
> 🏛️ **Institution**: Vignan University — Department of Bioinformatics  

### 👥 Research & Development Team
* 🧬 **Simbisai Chinhema** (Department of Bioinformatics, Vignan University)
* 🔬 **Craig M Mariwa** (Department of Bioinformatics, Vignan University)
* 💻 **Mellisa M Mpofu** (Department of Bioinformatics, Vignan University)

---

## ✨ Key Features

### 1. 🎛 Interactive Sonification Frequency Graph
* **Pitch Contour Visualization**: Real-time rendering of genetic sequences mapping nucleotide frequencies ($262\text{ Hz}$ – $1046\text{ Hz}$) on a high-contrast smooth Catmull-Rom spline curve.
* **Click-to-Seek Canvas**: Click anywhere along the frequency curve to jump the playhead instantly to that exact base position.
* **Hover Data Tooltips**: Inspect base types (`A`, `T`, `G`, `C`), sequence position numbers, and pitch frequencies in real-time.
* **Nucleotide Palette**:
  * <span style="color:#047857;">**A (Adenine)**</span>: 262.0 Hz (`C4`) — Emerald
  * <span style="color:#b45309;">**T (Thymine)**</span>: 523.0 Hz (`C5`) — Amber
  * <span style="color:#1d4ed8;">**G (Guanine)**</span>: 392.0 Hz (`G4`) — Blue
  * <span style="color:#7e22ce;">**C (Cytosine)**</span>: 330.0 Hz (`E4`) — Purple

### 2. 🤖 Agentic Orchestrator Sidebar
* **AI Agent Chat**: Perform conversational genomic analysis, variant explanations, and protein encoding queries using Anthropic Claude / OpenAI models.
* **Live Audio Meter**: Animated 4-bar volume equalizer mirroring playback state and sonification energy.
* **Inspector Panel**: Single-event breakdown highlighting position, reference/sample bases, event types (substitutions, insertions, deletions), and paper provenance (`PAPER_EXACT`).
* **LLM Setup Panel**: Connect custom API keys securely for autonomous reasoning agents.

### 3. 🧬 Dynamic Sequence Alignment & Sanitization
* **Pairwise Alignment Track**: Visual substitution markers highlighting variant positions between Reference (Gene A) and Sample (Gene B).
* **Strict ATGC Sanitizer**: Input validation parser that strips non-DNA characters (such as FASTA headers or extraneous whitespace), guaranteeing canonical base outputs (`A`, `T`, `G`, `C`).
* **Local Sequence Import**: Upload local `.FASTA` and `.TXT` files directly from your PC or paste raw genomic sequences into the global header input modal.

---

## 🛠 Tech Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **State Management**: Zustand (`usePlayback.ts`)
- **Sonification Engine**: Web Audio API (`AudioEngine`)
- **Styling**: Vanilla CSS3 (Custom academic light design system)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` or `pnpm`

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/simbisaichinhema/Audigene.git
   cd Audigene
   ```

2. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Launch the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📄 Scientific Reference

- **Temple, M. D. (2017)**. *An auditory display for DNA sequence analysis*. BMC Bioinformatics. Pitch-to-frequency mapping rules (`A=C4, C=E4, G=G4, T=C5`) follow exact parameters established in peer-reviewed genomic sonification literature.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# Audigene
