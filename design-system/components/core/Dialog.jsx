import React from 'react';
import { Icon } from './Icon.jsx';
import { Button } from './Button.jsx';

/**
 * Centered modal dialog on a dim scrim. Used for Create Context confirms.
 * Provide `title`, body `children`, and footer `actions` (or use confirm props).
 */
export function Dialog({
  open = true, title, icon, children, onClose,
  confirmLabel, cancelLabel = 'Cancel', onConfirm, confirmVariant = 'primary',
  width = 460, actions, style = {},
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 'var(--z-dialog)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        animation: 'devlog-scrim-in var(--dur-fast) var(--ease-out)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: 'calc(100% - 32px)',
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'devlog-dialog-in var(--dur-base) var(--ease-spring)',
          ...style,
        }}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '13px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {icon && <Icon name={icon} size={17} color="var(--accent)" />}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{title}</span>
          </div>
        )}
        <div style={{ padding: '16px' }}>{children}</div>
        {(actions || confirmLabel) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px' }}>
            {actions || (
              <>
                <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
                <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
              </>
            )}
          </div>
        )}
      </div>
      <style>{'@keyframes devlog-scrim-in{from{opacity:0}to{opacity:1}}@keyframes devlog-dialog-in{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}'}</style>
    </div>
  );
}
