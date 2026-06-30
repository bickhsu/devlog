import React from 'react';

export interface LogoProps {
  /** "full" = caret + devlog, "mark" = caret block only, "bracket" = [ devlog ]. */
  variant?: 'full' | 'mark' | 'bracket';
  /** Cap height in px. Default 20. */
  size?: number;
  /** Animate the caret block. Default false. */
  blink?: boolean;
  color?: string;
  style?: React.CSSProperties;
}

/** DevLog wordmark — terminal caret + mono "devlog". */
export function Logo(props: LogoProps): JSX.Element;
