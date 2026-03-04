import { createFileRoute } from '@tanstack/react-router';
import './selection-preview.css';

export const Route = createFileRoute('/dev/selection-preview')({
  component: SelectionPreviewPage,
});

const OPTIONS = [
  {
    name: 'Radioactive Pink',
    bg: 'oklch(0.72 0.38 345)',
    fg: 'oklch(0.15 0 0)',
  },
  { name: 'Hot Magenta', bg: 'oklch(0.65 0.42 330)', fg: 'oklch(0.15 0 0)' },
  { name: 'Toxic Blue', bg: 'oklch(0.72 0.28 240)', fg: 'oklch(0.15 0 0)' },
  { name: 'Electric Cyan', bg: 'oklch(0.85 0.22 200)', fg: 'oklch(0.15 0 0)' },
  { name: 'Acid Green', bg: 'oklch(0.85 0.28 140)', fg: 'oklch(0.15 0 0)' },
  { name: 'Neon Yellow', bg: 'oklch(0.95 0.22 105)', fg: 'oklch(0.15 0 0)' },
  { name: 'Laser Orange', bg: 'oklch(0.78 0.22 55)', fg: 'oklch(0.15 0 0)' },
  { name: 'Toxic Purple', bg: 'oklch(0.65 0.32 300)', fg: 'oklch(0.15 0 0)' },
];

const SAMPLE =
  'Select this text to preview the highlight colour. The quick brown fox jumps over the lazy dog.';

function SelectionPreviewPage() {
  return (
    <div className="mx-auto max-w-2xl px-8 py-16">
      <h1 className="mb-2 text-3xl font-bold">Selection Colour Preview</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Drag to select text in each swatch to preview how it looks.
      </p>
      <div className="flex flex-col gap-6">
        {OPTIONS.map((opt, i) => (
          <div key={opt.name}>
            <div className="mb-1 flex items-center gap-3">
              <div
                className="size-4 rounded-sm"
                style={{ backgroundColor: opt.bg }}
              />
              <span className="font-mono text-xs text-muted-foreground">
                {opt.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground opacity-50">
                {opt.bg}
              </span>
            </div>
            <p
              className={`sel-swatch-${i} rounded-md border px-4 py-3 text-sm leading-relaxed`}
            >
              {SAMPLE}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
