import React from 'react';

export interface ContextBadgeProps {
  /** Full context path, e.g. "/metai/cad-agent/adapter". */
  path?: string;
  size?: 'sm' | 'md';
  /** Lit accent state — typically when its picker is open. */
  active?: boolean;
  /** Clickable (opens the column picker). Default true. */
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/**
 * DevLog's signature context-path pill. Click to open the column picker.
 * @startingPoint section="Context" subtitle="The context path pill" viewport="700x140"
 */
export function ContextBadge(props: ContextBadgeProps): JSX.Element;
