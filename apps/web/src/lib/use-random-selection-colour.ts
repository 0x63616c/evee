import { useEffect } from 'react';

const COLOURS = [
  { bg: 'oklch(0.72 0.38 345)', fg: 'oklch(0.15 0 0)' }, // Radioactive Pink
  { bg: 'oklch(0.65 0.42 330)', fg: 'oklch(0.15 0 0)' }, // Hot Magenta
  { bg: 'oklch(0.72 0.28 240)', fg: 'oklch(0.15 0 0)' }, // Toxic Blue
  { bg: 'oklch(0.85 0.22 200)', fg: 'oklch(0.15 0 0)' }, // Electric Cyan
  { bg: 'oklch(0.85 0.28 140)', fg: 'oklch(0.15 0 0)' }, // Acid Green
  { bg: 'oklch(0.95 0.22 105)', fg: 'oklch(0.15 0 0)' }, // Neon Yellow
  { bg: 'oklch(0.78 0.22 55)', fg: 'oklch(0.15 0 0)' }, // Laser Orange
  { bg: 'oklch(0.65 0.32 300)', fg: 'oklch(0.15 0 0)' }, // Toxic Purple
];

export function useRandomSelectionColour() {
  useEffect(() => {
    const handler = () => {
      const pick = COLOURS[Math.floor(Math.random() * COLOURS.length)];
      document.documentElement.style.setProperty('--sel-bg', pick.bg);
      document.documentElement.style.setProperty('--sel-fg', pick.fg);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
}
