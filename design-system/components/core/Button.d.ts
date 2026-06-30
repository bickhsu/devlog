import React from 'react';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Material Symbols name rendered before the label. */
  icon?: string;
  /** Material Symbols name rendered after the label. */
  iconRight?: string;
  style?: React.CSSProperties;
}

/**
 * DevLog button. Mono label, hairline border, tactile 0.97 press.
 * @startingPoint section="Core" subtitle="Buttons, icon buttons & keys" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
