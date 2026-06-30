import React from 'react';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Material Symbols ligature name. */
  icon: string;
  /** Button box size in px. Default 34. */
  size?: number;
  /** Glyph size in px. Defaults to ~56% of size. */
  iconSize?: number;
  /** Persistent active/selected state (accent color + filled backing). */
  active?: boolean;
  /** Tooltip + aria-label. */
  title?: string;
  style?: React.CSSProperties;
}

/** Square icon-only button with faint hover backing. */
export function IconButton(props: IconButtonProps): JSX.Element;
