import React from 'react';

export interface TooltipProps {
  /** Tooltip content. */
  label: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  style?: React.CSSProperties;
}

/** Hover tooltip — reveals timestamps / context on a log entry. */
export function Tooltip(props: TooltipProps): JSX.Element;
