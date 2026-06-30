// DevLog app — collapsible sidebar (context tree + settings/header).
function Sidebar({ open, sidebarData, activePath, onSelect, onToggle, onOpenSettings }) {
  const { IconButton, TreeNav, Logo } = window.DevLogDesignSystem_c9930f;
  return (
    <div
      style={{
        width: open ? 'var(--sidebar-w)' : 0,
        flex: '0 0 auto',
        overflow: 'hidden',
        transition: 'width var(--dur-slow) var(--ease-out)',
      }}
    >
      <div style={{
        width: 'var(--sidebar-w)', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-subtle)',
        borderRight: '1px solid var(--border)',
      }}>
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', height: 'var(--topbar-h)', boxSizing: 'border-box',
        }}>
          <Logo size={18} />
          <div style={{ display: 'flex', gap: 2 }}>
            <IconButton icon="settings" size={30} iconSize={18} title="Settings" onClick={onOpenSettings} />
            <IconButton icon="panel-left-close" size={30} iconSize={18} title="Collapse sidebar" onClick={onToggle} />
          </div>
        </div>

        {/* tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          <TreeNav nodes={sidebarData} activePath={activePath} onSelect={onSelect} />
        </div>

        {/* footer */}
        <div style={{
          padding: '10px 14px', borderTop: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>11 contexts</span>
          <span>v0.3.0</span>
        </div>
      </div>
    </div>
  );
}
window.Sidebar = Sidebar;
