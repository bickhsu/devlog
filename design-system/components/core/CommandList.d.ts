import React from 'react';

export interface CommandListProps {
  /** All selectable context paths (full, leading-slash). */
  paths: string[];
  /** Current filter text (the "/…" the user typed). */
  query?: string;
  /** Index of the keyboard-highlighted row. */
  activeIndex?: number;
  onSelect?: (path: string) => void;
  onHover?: (index: number) => void;
  header?: string;
  style?: React.CSSProperties;
}

/**
 * The "/" command palette — flat, filterable list of every context path.
 * @startingPoint section="Context" subtitle="Slash command palette" viewport="560x340"
 */
export function CommandList(props: CommandListProps): JSX.Element;
