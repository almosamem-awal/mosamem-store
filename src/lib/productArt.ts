export type ProductArchetype =
  | 'case'
  | 'charger'
  | 'cable'
  | 'powerbank'
  | 'stand'
  | 'watchband'
  | 'audio'
  | 'robot'
  | 'drone'
  | 'stemkit'
  | 'cube'
  | 'lamp'
  | 'diffuser'
  | 'pen'
  | 'desk'
  | 'clock';

interface ArtOptions {
  archetype: ProductArchetype;
  primaryHex: string;
  accentHex?: string;
  label?: string;
  angle?: 'front' | 'detail';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderArchetypeShape(
  archetype: ProductArchetype,
  primaryHex: string,
  accentHex: string,
  angle: 'front' | 'detail'
): string {
  const rotate = angle === 'detail' ? 'rotate(-8 200 150) scale(1.06)' : '';
  switch (archetype) {
    case 'case':
      return `
        <g transform="${rotate}">
          <rect x="136" y="42" width="128" height="216" rx="24" fill="${primaryHex}" stroke="#334155" stroke-width="2.5"/>
          <rect x="142" y="48" width="116" height="204" rx="20" fill="url(#metalSheen)" opacity="0.45"/>
          <rect x="150" y="58" width="42" height="44" rx="11" fill="#0B0F19" stroke="#475569" stroke-width="1.5"/>
          <circle cx="163" cy="72" r="7" fill="#1E293B" stroke="${accentHex}" stroke-width="1.2"/>
          <circle cx="180" cy="86" r="7" fill="#1E293B" stroke="${accentHex}" stroke-width="1.2"/>
          <circle cx="163" cy="88" r="5" fill="#0F172A"/>
          <circle cx="200" cy="158" r="32" fill="none" stroke="${accentHex}" stroke-width="4.5" opacity="0.9"/>
          <rect x="197" y="196" width="6" height="18" rx="3" fill="${accentHex}" opacity="0.9"/>
        </g>`;
    case 'charger':
      return `
        <g transform="${rotate}">
          <rect x="144" y="64" width="112" height="148" rx="18" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <rect x="152" y="72" width="96" height="132" rx="14" fill="url(#metalSheen)" opacity="0.4"/>
          <rect x="172" y="212" width="10" height="32" rx="3" fill="#CBD5E1"/>
          <rect x="218" y="212" width="10" height="32" rx="3" fill="#CBD5E1"/>
          <rect x="180" y="96" width="40" height="10" rx="5" fill="#0B0F19" stroke="${accentHex}" stroke-width="1.2"/>
          <rect x="180" y="116" width="40" height="10" rx="5" fill="#0B0F19" stroke="${accentHex}" stroke-width="1.2"/>
          <circle cx="200" cy="164" r="14" fill="#0B0F19" opacity="0.6"/>
          <path d="M202 154 L195 165 H201 L198 174 L206 162 H200 Z" fill="${accentHex}"/>
        </g>`;
    case 'cable':
      return `
        <g transform="${rotate}">
          <circle cx="200" cy="155" r="72" fill="none" stroke="${primaryHex}" stroke-width="14"/>
          <circle cx="200" cy="155" r="72" fill="none" stroke="${accentHex}" stroke-width="2.5" stroke-dasharray="10 8"/>
          <rect x="138" y="54" width="28" height="44" rx="6" fill="#0F172A" stroke="${accentHex}" stroke-width="1.5"/>
          <rect x="145" y="42" width="14" height="14" rx="2" fill="#E2E8F0"/>
          <rect x="234" y="54" width="28" height="44" rx="6" fill="#0F172A" stroke="${accentHex}" stroke-width="1.5"/>
          <rect x="241" y="42" width="14" height="14" rx="2" fill="#E2E8F0"/>
        </g>`;
    case 'powerbank':
      return `
        <g transform="${rotate}">
          <rect x="128" y="64" width="144" height="176" rx="22" fill="${primaryHex}" stroke="#475569" stroke-width="2.2"/>
          <rect x="136" y="72" width="128" height="160" rx="18" fill="url(#metalSheen)" opacity="0.35"/>
          <circle cx="200" cy="142" r="36" fill="none" stroke="${accentHex}" stroke-width="4"/>
          <rect x="152" y="198" width="96" height="20" rx="6" fill="#0B0F19"/>
          <rect x="162" y="205" width="54" height="6" rx="3" fill="${accentHex}"/>
        </g>`;
    case 'stand':
      return `
        <g transform="${rotate}">
          <ellipse cx="200" cy="236" rx="64" ry="14" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <path d="M192 232 L182 140 L214 140 L208 232 Z" fill="url(#metalSheen)"/>
          <circle cx="200" cy="112" r="46" fill="${primaryHex}" stroke="${accentHex}" stroke-width="3"/>
          <circle cx="200" cy="112" r="24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="6 4"/>
        </g>`;
    case 'watchband':
      return `
        <g transform="${rotate}">
          <rect x="174" y="34" width="52" height="62" rx="8" fill="${primaryHex}" stroke="#475569" stroke-width="1.8"/>
          <rect x="164" y="94" width="72" height="78" rx="18" fill="#0B0F19" stroke="${accentHex}" stroke-width="2.5"/>
          <rect x="172" y="102" width="56" height="62" rx="12" fill="#1E293B"/>
          <rect x="174" y="170" width="52" height="62" rx="8" fill="${primaryHex}" stroke="#475569" stroke-width="1.8"/>
          <line x1="178" y1="56" x2="222" y2="56" stroke="#334155" stroke-width="2"/>
          <line x1="178" y1="208" x2="222" y2="208" stroke="#334155" stroke-width="2"/>
        </g>`;
    case 'audio':
      return `
        <g transform="${rotate}">
          <rect x="134" y="88" width="132" height="126" rx="36" fill="${primaryHex}" stroke="#475569" stroke-width="2.2"/>
          <path d="M134 134 H266" stroke="#334155" stroke-width="2"/>
          <circle cx="200" cy="158" r="6" fill="${accentHex}"/>
          <rect x="176" y="128" width="48" height="8" rx="4" fill="#1E293B"/>
        </g>`;
    case 'robot':
      return `
        <g transform="${rotate}">
          <rect x="148" y="64" width="104" height="72" rx="18" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <rect x="162" y="80" width="76" height="36" rx="10" fill="#0B0F19"/>
          <circle cx="182" cy="98" r="7" fill="${accentHex}"/>
          <circle cx="218" cy="98" r="7" fill="${accentHex}"/>
          <rect x="134" y="144" width="132" height="82" rx="16" fill="url(#metalSheen)" stroke="#475569" stroke-width="2"/>
          <circle cx="152" cy="236" r="18" fill="#0F172A" stroke="${accentHex}" stroke-width="3"/>
          <circle cx="248" cy="236" r="18" fill="#0F172A" stroke="${accentHex}" stroke-width="3"/>
          <line x1="200" y1="64" x2="200" y2="42" stroke="#64748B" stroke-width="3"/>
          <circle cx="200" cy="38" r="6" fill="${accentHex}"/>
        </g>`;
    case 'drone':
      return `
        <g transform="${rotate}">
          <line x1="116" y1="92" x2="284" y2="208" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
          <line x1="284" y1="92" x2="116" y2="208" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="116" cy="92" rx="34" ry="8" fill="${accentHex}" opacity="0.35"/>
          <ellipse cx="284" cy="92" rx="34" ry="8" fill="${accentHex}" opacity="0.35"/>
          <ellipse cx="116" cy="208" rx="34" ry="8" fill="${accentHex}" opacity="0.35"/>
          <ellipse cx="284" cy="208" rx="34" ry="8" fill="${accentHex}" opacity="0.35"/>
          <rect x="164" y="114" width="72" height="72" rx="18" fill="${primaryHex}" stroke="${accentHex}" stroke-width="2.5"/>
          <circle cx="200" cy="150" r="14" fill="#0B0F19" stroke="${accentHex}" stroke-width="2"/>
        </g>`;
    case 'stemkit':
      return `
        <g transform="${rotate}">
          <rect x="112" y="78" width="176" height="148" rx="14" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <rect x="128" y="96" width="64" height="52" rx="8" fill="#0B0F19" stroke="${accentHex}" stroke-width="1.8"/>
          <circle cx="160" cy="122" r="14" fill="none" stroke="${accentHex}" stroke-width="2.5"/>
          <rect x="206" y="96" width="66" height="22" rx="5" fill="#1E293B"/>
          <rect x="206" y="126" width="66" height="22" rx="5" fill="#1E293B"/>
          <rect x="128" y="162" width="144" height="44" rx="8" fill="#0F172A"/>
          <circle cx="152" cy="184" r="8" fill="${accentHex}"/>
          <circle cx="182" cy="184" r="8" fill="#FF6B00"/>
          <circle cx="212" cy="184" r="8" fill="#94A3B8"/>
        </g>`;
    case 'cube':
      return `
        <g transform="${rotate}">
          <polygon points="200,56 276,100 276,192 200,236 124,192 124,100" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <polygon points="200,56 276,100 200,144 124,100" fill="url(#metalSheen)" opacity="0.65"/>
          <line x1="200" y1="144" x2="200" y2="236" stroke="${accentHex}" stroke-width="2.5"/>
          <line x1="124" y1="100" x2="200" y2="144" stroke="${accentHex}" stroke-width="2.5"/>
          <line x1="276" y1="100" x2="200" y2="144" stroke="${accentHex}" stroke-width="2.5"/>
          <circle cx="200" cy="144" r="10" fill="${accentHex}"/>
        </g>`;
    case 'lamp':
      return `
        <g transform="${rotate}">
          <ellipse cx="200" cy="238" rx="56" ry="12" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <path d="M168 230 C168 186, 232 186, 232 230" fill="#1E293B"/>
          <circle cx="200" cy="126" r="56" fill="url(#glowOrb)" stroke="${accentHex}" stroke-width="2"/>
          <ellipse cx="200" cy="126" rx="56" ry="16" fill="none" stroke="${accentHex}" stroke-width="1.5" opacity="0.7"/>
        </g>`;
    case 'diffuser':
      return `
        <g transform="${rotate}">
          <path d="M156 122 L144 236 H256 L244 122 Z" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <rect x="174" y="88" width="52" height="34" rx="6" fill="#0B0F19" stroke="${accentHex}" stroke-width="1.8"/>
          <circle cx="200" cy="178" r="22" fill="none" stroke="${accentHex}" stroke-width="2"/>
          <path d="M192 72 Q200 54 208 72" fill="none" stroke="${accentHex}" stroke-width="2" opacity="0.7"/>
        </g>`;
    case 'pen':
      return `
        <g transform="${rotate}">
          <rect x="118" y="138" width="164" height="34" rx="10" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <rect x="128" y="114" width="144" height="14" rx="7" fill="#1E293B" stroke="${accentHex}" stroke-width="1.8"/>
          <polygon points="272,114 294,121 272,128" fill="${accentHex}"/>
          <rect x="148" y="182" width="104" height="12" rx="4" fill="#334155"/>
        </g>`;
    case 'desk':
      return `
        <g transform="${rotate}">
          <rect x="108" y="168" width="184" height="58" rx="10" fill="${primaryHex}" stroke="#475569" stroke-width="2"/>
          <rect x="122" y="102" width="66" height="66" rx="8" fill="#1E293B" stroke="${accentHex}" stroke-width="1.8"/>
          <rect x="200" y="128" width="78" height="40" rx="8" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
          <circle cx="239" cy="148" r="8" fill="${accentHex}"/>
        </g>`;
    case 'clock':
      return `
        <g transform="${rotate}">
          <rect x="108" y="96" width="184" height="108" rx="18" fill="${primaryHex}" stroke="#475569" stroke-width="2.5"/>
          <rect x="120" y="108" width="160" height="84" rx="12" fill="#0B0F19"/>
          <text x="200" y="162" text-anchor="middle" font-family="monospace" font-size="34" font-weight="700" fill="${accentHex}">10:09</text>
        </g>`;
  }
}

export function createStudioProductImage(options: ArtOptions): string {
  const {
    archetype,
    primaryHex,
    accentHex = '#00FF87',
    label = '',
    angle = 'front',
  } = options;

  const shape = renderArchetypeShape(archetype, primaryHex, accentHex, angle);
  const safeLabel = escapeXml(label.slice(0, 22));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="55%" stop-color="#F8FAFC"/>
        <stop offset="100%" stop-color="#F1F5F9"/>
      </linearGradient>
      <radialGradient id="studioSpot" cx="50%" cy="44%" r="54%">
        <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.14"/>
        <stop offset="55%" stop-color="#CBD5E1" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#F8FAFC" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="metalSheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.65"/>
        <stop offset="50%" stop-color="#94A3B8" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#0F172A" stop-opacity="0.35"/>
      </linearGradient>
      <radialGradient id="pedestalShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0F172A" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#0F172A" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowOrb" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="55%" stop-color="${accentHex}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#059669"/>
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bgGrad)"/>
    <rect width="400" height="300" fill="url(#studioSpot)"/>
    <ellipse cx="200" cy="252" rx="116" ry="15" fill="url(#pedestalShadow)"/>
    ${shape}
    ${
      safeLabel
        ? `<text x="200" y="274" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="600" letter-spacing="1.6" fill="#64748B">${safeLabel}</text>`
        : ''
    }
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
