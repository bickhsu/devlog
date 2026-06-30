import React from 'react';

export interface DateDividerProps {
  /** YYYY/MM/DD. */
  date?: string;
  sticky?: boolean;
  style?: React.CSSProperties;
}

/** Date divider with hairline rule between log groups. */
export function DateDivider(props: DateDividerProps): JSX.Element;
