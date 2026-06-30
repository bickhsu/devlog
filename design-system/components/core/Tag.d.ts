import React from 'react';

export interface TagProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'context';
  /** Show a leading status dot in the tone color. */
  dot?: boolean;
  style?: React.CSSProperties;
}

/** Small status / category pill in mono. */
export function Tag(props: TagProps): JSX.Element;
