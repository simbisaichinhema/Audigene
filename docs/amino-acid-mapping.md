# Amino Acid → Pitch Mapping (Table 7, Temple 2017)

**Status**: NOT YET IMPLEMENTED in AudiGene
**Source**: Temple (2017), BMC Bioinformatics, Table 7, page 6

## Paper Specification

The paper's Codon Walking method requires mapping each amino acid to a pitch
using a C major pentatonic scale. The mapping is based on amino acid chemistry:

### Amino Acid Classification

| Category | Amino Acids | Pitch Range |
|----------|------------|-------------|
| Positive, basic, special | Gly, Ala, Val, Leu, Ile, Pro, Phe, Trp, Met, Cys | Higher pitches (E5, G5, A5, C6) |
| Acidic, amidic | Asp, Glu, Asn, Gln | Middle pitches (C4, E4) |
| Basic | Lys, Arg, His | Lower pitches (G3, A3, B3) |

### Table 7: Amino Acid → Pitch Mapping

| Amino Acid | 3-Letter | 1-Letter | Category | Pitch |
|-----------|----------|----------|----------|-------|
| Glycine | Gly | G | Special | E5 |
| Alanine | Ala | A | Positive | G5 |
| Valine | Val | V | Positive | A5 |
| Leucine | Leu | L | Positive | C6 |
| Isoleucine | Ile | I | Positive | E5 |
| Proline | Pro | P | Special | G5 |
| Phenylalanine | Phe | F | Positive | A5 |
| Tryptophan | Trp | W | Special | C6 |
| Methionine | Met | M | Special | E5 |
| Cysteine | Cys | C | Special | G5 |
| Serine | Ser | S | — | G5 |
| Threonine | Thr | T | — | A5 |
| Tyrosine | Tyr | Y | — | C6 |
| Aspartic Acid | Asp | D | Acidic | C4 |
| Glutamic Acid | Glu | E | Acidic | E4 |
| Asparagine | Asn | N | Amidic | C4 |
| Glutamine | Gln | Q | Amidic | E4 |
| Lysine | Lys | K | Basic | G3 |
| Arginine | Arg | R | Basic | A3 |
| Histidine | His | H | Basic | B3 |

**Note**: The exact pitch values in Table 7 need to be verified against the
PDF. The above is reconstructed from the paper's description of the
classification system. The paper states the pitches follow a C major pentatonic
scale (C-D-E-G-A) with different octaves for different chemical categories.

### Additional Features

- **120ms silence markers**: Between amino acid pitches, the paper mentions
  inserting 120ms silences ("Each pitch is followed by 120 ms of silence"
  — from Figure 5 caption description of aminoWalk)
- **Start codons**: "assigned a higher pitch" (AMBIGUOUS — no specific interval)
- **Stop codons**: "assigned a lower pitch" (AMBIGUOUS — no specific interval)

## Why This Is Not Implemented

1. The mapping requires codon→amino acid translation, which depends on
   the genetic code table (Biopython provides this)
2. The exact pitch values in Table 7 need precise verification from the PDF
3. The classification system (positive/basic/special → high, acidic/amidic → low)
   is described qualitatively; exact semitone assignments need verification

## Implementation Notes

When implementing, this should:
- Use Biopython's `Seq.translate()` for codon→amino acid translation
- Map each amino acid to its pitch using the table above
- Insert 120ms silence between pitches
- Handle start/stop codons per the paper's qualitative guidelines
- Be placed in `sonification/paper_2017/codon_walking.py` as the correct
  implementation, replacing the current hybrid approach
