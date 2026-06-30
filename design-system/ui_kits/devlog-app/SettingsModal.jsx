// DevLog app — settings modal (Theme + Copy Context Range).
function SettingsModal({ open, theme, onTheme, range, onRange, onClose }) {
  const { Dialog, SegmentedControl, Switch, Icon } = window.DevLogDesignSystem_c9930f;
  if (!open) return null;

  const Row = ({ icon, label, hint, children }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <Icon name={icon} size={18} color="var(--text-faint)" />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{label}</div>
        {hint && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <Dialog title="Settings" icon="settings" width={520} onClose={onClose} actions={<span />}>
      <div style={{ marginTop: -4 }}>
        <Row icon={theme === 'dark' ? 'moon' : 'sun'} label="Theme" hint={theme === 'dark' ? 'dark · easy on long sessions' : 'light'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="sun" size={16} color={theme === 'light' ? 'var(--accent)' : 'var(--text-faint)'} />
            <Switch checked={theme === 'dark'} onChange={(d) => onTheme(d ? 'dark' : 'light')} />
            <Icon name="moon" size={16} color={theme === 'dark' ? 'var(--accent)' : 'var(--text-faint)'} />
          </div>
        </Row>
        <Row icon="copy" label="Copy Context Range" hint="what the copy button grabs">
          <SegmentedControl options={['Today', 'Last Week', 'All']} value={range} onChange={onRange} size="sm" />
        </Row>
        <Row icon="keyboard" label="Switch context" hint="/ palette · cd + Tab columns · click the badge">
          <span style={{ display: 'flex', gap: 5 }}>
            {['/', 'Tab'].map((k) => (
              <kbd key={k} style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)',
                background: 'var(--surface)', border: '1px solid var(--border)', borderBottomWidth: 2,
                borderRadius: 'var(--radius-xs)', padding: '2px 7px',
              }}>{k}</kbd>
            ))}
          </span>
        </Row>
      </div>
    </Dialog>
  );
}
window.SettingsModal = SettingsModal;
