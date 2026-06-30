import React from 'react';

export interface ComposerProps {
  /** Current context path shown in the pinned badge. */
  context?: string;
  /** Controlled value. */
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  /** Fired on ⌘/Ctrl+Enter or send button. */
  onSubmit?: (value: string) => void;
  /** Fired when the context badge is clicked. */
  onBadgeClick?: () => void;
  /** Lights the badge (e.g. while its picker is open). */
  badgeActive?: boolean;
  /** Floating element rendered above the composer (CommandList / ColumnPicker). */
  popover?: React.ReactNode;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}

/**
 * DevLog composer — context badge + multiline log input. The product's primary input.
 * @startingPoint section="Context" subtitle="Log composer with context badge" viewport="760x160"
 */
export function Composer(props: ComposerProps): JSX.Element;
