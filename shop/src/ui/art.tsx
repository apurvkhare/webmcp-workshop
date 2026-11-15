/** Product pictures, drawn per category and tinted with the product colour. No image files: the room may be offline. */
import type { Category } from '../core/types.ts';

interface Tint {
  fill: string;
  ink: string;
  wash: string;
}

const TINTS: Record<string, Tint> = {
  black: { fill: '#2b2e35', ink: '#111318', wash: '#eceef1' },
  blue: { fill: '#3b6fd8', ink: '#1d3c86', wash: '#e6edfb' },
  coral: { fill: '#f07662', ink: '#9c3727', wash: '#fdebe7' },
  gold: { fill: '#d6a83c', ink: '#7a5a10', wash: '#faf2dc' },
  green: { fill: '#3e8f60', ink: '#1d5034', wash: '#e4f2e9' },
  grey: { fill: '#8e949e', ink: '#4a5059', wash: '#edeff2' },
  navy: { fill: '#26396a', ink: '#111b38', wash: '#e5e9f3' },
  orange: { fill: '#ef8c2d', ink: '#934e0e', wash: '#fdefdf' },
  pink: { fill: '#ea86b2', ink: '#9b3d68', wash: '#fce9f2' },
  red: { fill: '#d6443f', ink: '#86201c', wash: '#fbe6e5' },
  silver: { fill: '#c6cbd3', ink: '#68707b', wash: '#eff1f4' },
  teal: { fill: '#1f9d99', ink: '#0d5c59', wash: '#dff3f2' },
  white: { fill: '#f8f8f5', ink: '#8a8f97', wash: '#ebeeee' }
};

export const tint = (colour: string): Tint => TINTS[colour] ?? TINTS.grey!;

export const colourName = (colour: string) => colour.charAt(0).toUpperCase() + colour.slice(1);

export const CATEGORY_LABELS: Record<Category, string> = {
  headphones: 'Headphones',
  earbuds: 'Earbuds',
  speakers: 'Speakers',
  keyboards: 'Keyboards',
  mice: 'Mice',
  chargers: 'Chargers and cables',
  smartwatches: 'Smartwatches'
};

/** A representative colour for each category's tile. */
export const CATEGORY_COLOURS: Record<Category, string> = {
  headphones: 'blue',
  earbuds: 'white',
  speakers: 'teal',
  keyboards: 'grey',
  mice: 'pink',
  chargers: 'black',
  smartwatches: 'green'
};

function Drawing({ category, t }: { category: Category; t: Tint }) {
  const line = { stroke: t.ink, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  switch (category) {
    case 'headphones':
      return (
        <g>
          <path d="M50 96 C50 50 72 30 100 30 C128 30 150 50 150 96" fill="none" stroke={t.ink} strokeWidth="14" strokeLinecap="round" />
          <path d="M50 96 C50 50 72 30 100 30 C128 30 150 50 150 96" fill="none" stroke={t.fill} strokeWidth="9" strokeLinecap="round" />
          <rect x="34" y="82" width="32" height="54" rx="15" fill={t.fill} {...line} />
          <rect x="134" y="82" width="32" height="54" rx="15" fill={t.fill} {...line} />
          <rect x="60" y="90" width="11" height="38" rx="5.5" fill={t.ink} opacity="0.85" />
          <rect x="129" y="90" width="11" height="38" rx="5.5" fill={t.ink} opacity="0.85" />
        </g>
      );
    case 'earbuds':
      return (
        <g>
          <g transform="rotate(-14 78 92)">
            <rect x="70" y="72" width="17" height="62" rx="8.5" fill={t.fill} {...line} />
            <circle cx="78" cy="68" r="23" fill={t.fill} {...line} />
            <ellipse cx="78" cy="62" rx="9" ry="7" fill={t.ink} opacity="0.7" />
          </g>
          <g transform="rotate(14 122 92)">
            <rect x="113" y="72" width="17" height="62" rx="8.5" fill={t.fill} {...line} />
            <circle cx="122" cy="68" r="23" fill={t.fill} {...line} />
            <ellipse cx="122" cy="62" rx="9" ry="7" fill={t.ink} opacity="0.7" />
          </g>
        </g>
      );
    case 'speakers':
      return (
        <g>
          <path d="M80 34 C80 18 120 18 120 34" fill="none" stroke={t.ink} strokeWidth="5" strokeLinecap="round" />
          <rect x="56" y="30" width="88" height="110" rx="28" fill={t.fill} {...line} />
          <circle cx="100" cy="78" r="30" fill={t.ink} opacity="0.88" />
          <circle cx="100" cy="78" r="12" fill={t.fill} opacity="0.55" />
          {[82, 94, 106, 118].map((x) => (
            <circle key={x} cx={x} cy="123" r="3" fill={t.ink} opacity="0.7" />
          ))}
        </g>
      );
    case 'keyboards': {
      const keys = [];
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 12; col++) {
          keys.push(<rect key={`${row}-${col}`} x={27 + col * 12.4} y={54 + row * 13} width="10" height="10" rx="2.2" fill={t.ink} opacity="0.32" />);
        }
      }
      return (
        <g>
          <rect x="20" y="46" width="160" height="78" rx="11" fill={t.fill} {...line} />
          {keys}
          <rect x="60" y="107" width="80" height="10" rx="2.5" fill={t.ink} opacity="0.32" />
        </g>
      );
    }
    case 'mice':
      return (
        <g>
          <path d="M100 24 C128 24 142 52 142 86 C142 120 125 140 100 140 C75 140 58 120 58 86 C58 52 72 24 100 24 Z" fill={t.fill} {...line} />
          <path d="M100 26 V74" {...line} fill="none" />
          <path d="M60 76 Q100 86 140 76" {...line} fill="none" />
          <rect x="95" y="40" width="10" height="20" rx="5" fill={t.ink} />
        </g>
      );
    case 'chargers':
      return (
        <g>
          <path d="M100 124 C100 150 150 150 166 118" fill="none" stroke={t.ink} strokeWidth="6" strokeLinecap="round" />
          <rect x="80" y="18" width="9" height="26" rx="2.5" fill={t.ink} />
          <rect x="111" y="18" width="9" height="26" rx="2.5" fill={t.ink} />
          <rect x="60" y="40" width="80" height="86" rx="16" fill={t.fill} {...line} />
          <rect x="84" y="80" width="32" height="9" rx="4.5" fill={t.ink} opacity="0.85" />
          <rect x="84" y="97" width="32" height="9" rx="4.5" fill={t.ink} opacity="0.85" />
          <circle cx="100" cy="60" r="4" fill={t.ink} opacity="0.5" />
        </g>
      );
    case 'smartwatches':
      return (
        <g>
          <rect x="77" y="8" width="46" height="44" rx="7" fill={t.fill} {...line} />
          <rect x="77" y="108" width="46" height="44" rx="7" fill={t.fill} {...line} />
          <rect x="139" y="68" width="8" height="22" rx="3" fill={t.ink} />
          <rect x="58" y="36" width="84" height="88" rx="24" fill={t.fill} {...line} />
          <rect x="67" y="45" width="66" height="70" rx="17" fill="#15171c" />
          <circle cx="100" cy="80" r="22" fill="none" stroke="#3a3f4a" strokeWidth="5" />
          <circle cx="100" cy="80" r="22" fill="none" stroke="#ffc23d" strokeWidth="5" strokeDasharray="96 200" strokeLinecap="round" transform="rotate(-90 100 80)" />
          <path d="M100 80 V67 M100 80 L109 85" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
  }
}

interface ArtProps {
  category: Category;
  colour: string;
  className?: string;
}

/** Decorative: the product's name is always next to it, so it has no text alternative of its own. */
export function ProductArt({ category, colour, className }: ArtProps) {
  const t = tint(colour);
  return (
    <div className={`art ${className ?? ''}`} style={{ background: t.wash }}>
      <svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">
        <ellipse cx="100" cy="150" rx="62" ry="6" fill={t.ink} opacity="0.1" />
        <Drawing category={category} t={t} />
      </svg>
    </div>
  );
}

export function Swatch({ colour }: { colour: string }) {
  const t = tint(colour);
  return <span className="swatch" style={{ background: t.fill, borderColor: t.ink }} />;
}
