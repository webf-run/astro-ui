import { Check, Copy, Play, RotateCcw } from 'lucide-solid';

const toolbarButton =
  'inline-flex items-center gap-1 rounded-md border border-[var(--sl-color-gray-5)] ' +
  'bg-[var(--sl-color-bg)] px-2 py-1 text-xs font-medium text-[var(--sl-color-gray-1)] ' +
  'transition-colors hover:border-[var(--sl-color-gray-4)] hover:bg-[var(--sl-color-gray-6)] ' +
  'hover:text-[var(--sl-color-text)]';

export interface ToolbarProps {
  /** Filename shown on the left. */
  filename: string;

  /** Whether the copy action recently fired (drives the Copy/Copied state). */
  copied: boolean;

  onCopy: () => void;
  onReset: () => void;
  onRun: () => void;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <div class='flex items-center justify-between gap-3 border-b border-(--sl-color-hairline) bg-(--sl-color-bg-nav) px-3 py-1.5'>
      <div class='flex items-center gap-2 text-xs text-(--sl-color-gray-3)'>
        <span class='inline-block h-2 w-2 rounded-full bg-(--sl-color-accent)' />
        <span class='font-mono'>{props.filename}</span>
      </div>
      <div class='flex items-center gap-1.5'>
        <button type='button' class={toolbarButton} onClick={props.onCopy}>
          {props.copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{props.copied ? 'Copied' : 'Copy'}</span>
        </button>
        <button type='button' class={toolbarButton} onClick={props.onReset}>
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
        <button
          type='button'
          class='inline-flex items-center gap-1 rounded-md bg-(--sl-color-accent) px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-(--sl-color-accent-high)'
          onClick={props.onRun}
        >
          <Play size={13} />
          <span>Run</span>
        </button>
      </div>
    </div>
  );
}
