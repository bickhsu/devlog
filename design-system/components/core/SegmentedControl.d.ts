import React from 'react';

export interface SegmentedOption { label: string; value: string; }

export interface SegmentedControlProps {
  /** Options as strings or {label,value}. */
  options: (string | SegmentedOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/** Segmented control with sliding indicator (e.g. Today / Last Week / All). */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
