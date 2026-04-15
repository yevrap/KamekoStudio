// ═══════════════════════════════════════════════════════════════════════════
// CARDS — SVG face and back generator
// ═══════════════════════════════════════════════════════════════════════════

// Standard suit ID mapping: 1=Spades, 2=Clubs, 3=Diamonds, 4=Hearts
const SUIT_PATHS = {
  1: 'M50,75 C50,75 25,100 25,60 C25,25 50,15 50,15 C50,15 75,25 75,60 C75,100 50,75 50,75 Z M50,75 L40,95 L60,95 Z', // Spades (stubbed, will refine)
  2: 'M50,45 A15,15 0 1,1 65,60 C65,70 55,75 50,75 C45,75 35,70 35,60 A15,15 0 1,1 50,45 Z M50,45 A15,15 0 1,1 35,60 M50,75 L40,95 L60,95 Z', // Clubs
  3: 'M50,15 L75,55 L50,95 L25,55 Z', // Diamonds
  4: 'M50,35 C50,35 25,10 25,45 C25,85 50,95 50,95 C50,95 75,85 75,45 C75,10 50,35 50,35 Z', // Hearts
};

// Refined paths scaled to [0,100] viewbox
const SUIT_D = {
  1: 'M50,85 C25,65 15,50 15,35 A15,15 0 0,1 45,35 C45,35 50,25 50,15 C50,25 55,35 55,35 A15,15 0 0,1 85,35 C85,50 75,65 50,85 Z M50,85 L40,100 L60,100 Z',
  2: 'M50,55 A15,15 0 1,1 50,15 A15,15 0 1,1 50,55 M30,75 A15,15 0 1,1 50,45 M70,75 A15,15 0 1,0 50,45 M50,70 L35,100 L65,100 Z', // Clubs rough
  3: 'M50,15 L80,55 L50,95 L20,55 Z', // Diamonds
  4: 'M50,25 C50,25 20,0 20,35 C20,70 50,95 50,95 C50,95 80,70 80,35 C80,0 50,25 50,25 Z', // Hearts
};

const PIPS = {
  1: 'M 50 72 C 50 72 35 98 15 82 C -5 66 10 38 50 3 C 90 38 105 66 85 82 C 65 98 50 72 50 72 Z M 50 66 L 35 100 L 65 100 Z', // Spades (Points UP)
  2: 'M 50,6 A 21,21 0 1,0 50,48 A 21,21 0 1,0 50,6 M 28,44 A 21,21 0 1,0 28,86 A 21,21 0 1,0 28,44 M 72,44 A 21,21 0 1,0 72,86 A 21,21 0 1,0 72,44 M 50,60 L 38,100 L 62,100 Z', // Clubs
  3: 'M 50 5 L 90 50 L 50 95 L 10 50 Z', // Diamonds
  4: 'M 50 28 C 50 28 35 2 15 18 C -5 34 10 62 50 97 C 90 62 105 34 85 18 C 65 2 50 28 50 28 Z', // Hearts (Points DOWN)
};

// Center transformations for pips based on rank.
// viewBox is 0 0 100 140
// Center area is approx x:20-80, y:30-110
const PIP_LAYOUT = {
  6: [{x:30,y:35}, {x:70,y:35}, {x:30,y:70}, {x:70,y:70}, {x:30,y:105, flip:1}, {x:70,y:105, flip:1}],
  7: [{x:30,y:30}, {x:70,y:30}, {x:50,y:50}, {x:30,y:70}, {x:70,y:70}, {x:30,y:110, flip:1}, {x:70,y:110, flip:1}],
  8: [{x:30,y:30}, {x:70,y:30}, {x:50,y:50}, {x:30,y:70}, {x:70,y:70}, {x:50,y:90, flip:1}, {x:30,y:110, flip:1}, {x:70,y:110, flip:1}],
  9: [{x:30,y:30}, {x:70,y:30}, {x:30,y:56}, {x:70,y:56}, {x:50,y:70}, {x:30,y:84, flip:1}, {x:70,y:84, flip:1}, {x:30,y:110, flip:1}, {x:70,y:110, flip:1}],
  10: [{x:30,y:25}, {x:70,y:25}, {x:50,y:40}, {x:30,y:53}, {x:70,y:53}, {x:30,y:87, flip:1}, {x:70,y:87, flip:1}, {x:50,y:100, flip:1}, {x:30,y:115, flip:1}, {x:70,y:115, flip:1}],
};

const FACE_LABELS = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

function buildPip(suitId, x, y, scale = 0.22, flip = false) {
  const rotation = flip ? 'rotate(180 50 50)' : '';
  const path = PIPS[suitId];
  // scale and center
  const ox = x - 50 * scale;
  const oy = y - 50 * scale;
  return `<g transform="translate(${ox}, ${oy}) scale(${scale}) ${rotation}">
    <path d="${path}" fill="currentColor"/>
  </g>`;
}

function buildCourtFigure(rank, suitId) {
  // Simplified stylized courts: A central geometric band with suit motifs
  let colorOp = 'opacity="0.15"'; // large background mark
  let paths = `<g transform="translate(10,30) scale(0.8)"><path d="${PIPS[suitId]}" fill="currentColor" ${colorOp} /></g>`;
  
  // Specific geometric styling for courts: 
  const cX = 50, cY = 70;
  
  if (rank === 14) { // ACE
    return buildPip(suitId, 50, 70, 0.6); // Massive center pip
  }
  
  // J, Q, K
  // Diagonal split line inside a rounded rect 
  let letters = `<text x="50" y="80" font-family="system-ui, sans-serif" font-weight="900" font-size="40" text-anchor="middle" fill="currentColor" opacity="0.15">${FACE_LABELS[rank]}</text>`;
  
  return `
    <rect x="25" y="30" width="50" height="80" rx="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
    <line x1="25" y1="110" x2="75" y2="30" stroke="currentColor" stroke-width="2" opacity="0.3"/>
    ${buildPip(suitId, 36, 45, 0.18)}
    ${buildPip(suitId, 64, 95, 0.18, true)}
    ${letters}
  `;
}

export function buildCardFaceSvg(suitId, rank) {
  const label = FACE_LABELS[rank] || String(rank);

  // Massive watermark in the center
  const centerWatermark = `
    <g transform="translate(50, 75) scale(1.8)" opacity="0.1">
      <path d="${PIPS[suitId]}" fill="currentColor" transform="translate(-50, -50)"/>
    </g>
  `;

  // Draw dominant top-left corner
  const cornerContent = `
    <g>
      <text x="12" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" text-anchor="start" fill="currentColor" letter-spacing="-1.5">${label}</text>
      ${buildPip(suitId, 20, 48, 0.22)}
    </g>
  `;
  
  // Flip for bottom-right corner
  const cornerFlipped = `
    <g transform="rotate(180 50 70)">
      <text x="12" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" text-anchor="start" fill="currentColor" letter-spacing="-1.5">${label}</text>
      ${buildPip(suitId, 20, 48, 0.22)}
    </g>
  `;

  return `<svg width="100%" height="100%" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
    ${centerWatermark}
    ${cornerContent}
    ${cornerFlipped}
  </svg>`;
}

export function buildCardBackSvg() {
  // Russian-folk-art inspired geometric motif
  // Using generic custom properties so it colors cleanly. We'll use currentColor as the stroke/primary, 
  // and opacity layers for richness.
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="motif" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="transparent"/>
          <!-- Diagonal cross-hatch + diamonds -->
          <path d="M10,0 L20,10 L10,20 L0,10 Z M0,0 L5,5 M20,0 L15,5 M0,20 L5,15 M20,20 L15,15" stroke="currentColor" stroke-width="1.2" opacity="0.25" fill="none"/>
          <circle cx="10" cy="10" r="2.5" fill="currentColor" opacity="0.3"/>
        </pattern>
      </defs>
      <!-- Base padding layer -->
      <rect x="5" y="5" width="90" height="130" rx="8" fill="url(#motif)"/>
      <rect x="5" y="5" width="90" height="130" rx="8" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6"/>
      <!-- Inner decorative border -->
      <rect x="12" y="12" width="76" height="116" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
      
      <!-- Central dominant geometric shape -->
      <g transform="translate(50, 70)">
        <polygon points="0,-25 25,0 0,25 -25,0" fill="currentColor" opacity="0.15"/>
        <polygon points="0,-25 25,0 0,25 -25,0" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8"/>
        <!-- Star burst inside -->
        <path d="M0,-15 L4,-4 L15,0 L4,4 L0,15 L-4,4 L-15,0 L-4,-4 Z" fill="currentColor" opacity="0.7"/>
      </g>
    </svg>
  `;
}
