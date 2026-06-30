import React from 'react';

export interface LogEntryProps {
  /** Optional bold first line. */
  title?: string;
  /** Entry body (preserves whitespace / newlines). */
  body: React.ReactNode;
  /** Timestamp shown on hover. */
  time?: string;
  /** Context path shown (as a badge) on hover. */
  context?: string;
  /** Optional status accent rail. */
  status?: 'done' | 'progress' | 'failed' | 'note';
  onCopy?: () => void;
  style?: React.CSSProperties;
}

/**
 * A work-log entry in the thread. Hover reveals time + context + copy.
 * @startingPoint section="Log" subtitle="A work-log entry" viewport="700x160"
 */
export function LogEntry(props: LogEntryProps): JSX.Element;
