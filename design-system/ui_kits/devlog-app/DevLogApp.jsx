// DevLog app — orchestrator. Wires the three context-switch interactions:
//   1. "/"  → flat command palette
//   2. "cd <path>" + Tab → cascading column picker
//   3. click the context badge → same column picker
//   + create-on-miss confirm dialog.
function DevLogApp() {
  const DS = window.DevLogDesignSystem_c9930f;
  const { Composer, CommandList, ColumnPicker, Dialog, IconButton, ContextBadge, Tag, Icon } = DS;
  const D = window.DevLogData;

  const [theme, setTheme] = React.useState('dark');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [range, setRange] = React.useState('Today');

  const [context, setContext] = React.useState('/metai/cad-agent/adapter');
  const [entries, setEntries] = React.useState(D.ENTRIES);
  const [justAddedId, setJustAddedId] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  const [value, setValue] = React.useState('');
  const [mode, setMode] = React.useState('none');          // none | slash | columns
  const [slashIndex, setSlashIndex] = React.useState(0);
  const [pickerPath, setPickerPath] = React.useState(['metai', 'cad-agent', 'adapter']);
  const [createPath, setCreatePath] = React.useState(null);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Also toggle .dark class for shadcn convention
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const filtered = React.useMemo(() => {
    const q = value.replace(/^\//, '').toLowerCase();
    return q ? D.PATHS.filter((p) => p.toLowerCase().includes(q)) : D.PATHS;
  }, [value]);

  const closePicker = () => { setMode('none'); };

  const onChange = (v) => {
    setValue(v);
    if (v.startsWith('/')) { setMode('slash'); setSlashIndex(0); }
    else if (mode === 'slash') { setMode('none'); }
  };

  const switchContext = (path) => {
    setContext(path);
    setValue('');
    setMode('none');
    setPickerPath(path.replace(/^\//, '').split('/'));
  };

  const tryCreate = (path) => { setCreatePath(path); setMode('none'); };

  const addEntry = (body) => {
    if (!body.trim() || body.startsWith('/') || body.trim().startsWith('cd ')) return;
    const now = new Date();
    const id = Date.now();
    setEntries((es) => [...es, {
      id, date: '2026/06/13', time: now.toTimeString().slice(0, 5), context, status: 'note', body,
    }]);
    setJustAddedId(id);
    setValue('');
  };

  // intercept navigation keys before the textarea handles them
  const onKeyDownCapture = (e) => {
    const v = value.trim();
    if (e.key === 'Tab' && v.startsWith('cd')) {
      e.preventDefault();
      const after = v.slice(2).trim().replace(/^\//, '');
      const segs = after ? after.split('/').filter(Boolean) : ['metai'];
      setPickerPath(segs.length ? segs : ['metai']);
      setMode('columns');
      return;
    }
    if (mode === 'slash') {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0))); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex((i) => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (filtered.length) switchContext(filtered[slashIndex]);
        else tryCreate('/' + value.replace(/^\//, ''));
      } else if (e.key === 'Escape') { e.preventDefault(); setMode('none'); }
    } else if (mode === 'columns' && e.key === 'Escape') { e.preventDefault(); setMode('none'); }
  };

  const doCopy = () => {
    const text = entries.filter((e) => e.context.startsWith(context)).map((e) => e.body).join('\n\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };

  // build the active popover
  let popover = null;
  if (mode === 'slash') {
    popover = <CommandList paths={D.PATHS} query={value} activeIndex={slashIndex} onHover={setSlashIndex}
      onSelect={(p) => switchContext(p)} />;
  } else if (mode === 'columns') {
    popover = <ColumnPicker tree={D.TREE} path={pickerPath}
      onSelect={(p, hasChildren) => { setPickerPath(p); if (!hasChildren) switchContext('/' + p.join('/')); }}
      onCommit={(p) => switchContext('/' + p.join('/'))} />;
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-app)', position: 'relative' }}>
      <window.Sidebar
        open={sidebarOpen}
        sidebarData={D.SIDEBAR}
        activePath={context}
        onSelect={switchContext}
        onToggle={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* top bar */}
        <div style={{
          height: 'var(--topbar-h)', flex: '0 0 auto', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!sidebarOpen && <IconButton icon="panel-left-open" title="Open sidebar" onClick={() => setSidebarOpen(true)} />}
            <ContextBadge path={context} size="sm" active={mode === 'columns'} onClick={() => { setPickerPath(context.replace(/^\//, '').split('/')); setMode(mode === 'columns' ? 'none' : 'columns'); }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {copied && <Tag tone="success" dot>copied</Tag>}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{range}</span>
            <IconButton icon="copy" title={'Copy ' + range} onClick={doCopy} />
          </div>
        </div>

        {/* thread */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '16px 24px 8px' }}>
            <window.Thread entries={entries} justAddedId={justAddedId} />
          </div>
        </div>

        {/* composer (with backdrop to dismiss pickers) */}
        <div style={{ flex: '0 0 auto', padding: '12px 24px 20px', position: 'relative' }}>
          {mode !== 'none' && (
            <div onClick={closePicker} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
          )}
          <div style={{ maxWidth: 'var(--composer-max)', margin: '0 auto', position: 'relative', zIndex: 60 }} onKeyDownCapture={onKeyDownCapture}>
            <Composer
              context={context}
              value={value}
              onChange={onChange}
              onSubmit={addEntry}
              onBadgeClick={() => { setPickerPath(context.replace(/^\//, '').split('/')); setMode(mode === 'columns' ? 'none' : 'columns'); }}
              badgeActive={mode === 'columns'}
              popover={popover}
              placeholder="log what you did…   ( / to switch · cd + Tab for columns )"
            />
            <div style={{
              display: 'flex', gap: 14, marginTop: 8, paddingLeft: 2,
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-faint)',
            }}>
              <Hint k="/" label="switch context" />
              <Hint k="cd ⇥" label="column picker" />
              <Hint k="⌘↵" label="log entry" />
            </div>
          </div>
        </div>
      </div>

      <window.SettingsModal open={settingsOpen} theme={theme} onTheme={setTheme} range={range} onRange={setRange} onClose={() => setSettingsOpen(false)} />

      <Dialog
        open={!!createPath}
        title="Create Context"
        icon="circle-plus"
        confirmLabel="OK"
        cancelLabel="Cancel"
        onClose={() => setCreatePath(null)}
        onConfirm={() => { switchContext(createPath); setCreatePath(null); }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 10 }}>this context doesn't exist yet — create it?</div>
          <div style={{
            padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--path)', wordBreak: 'break-all',
          }}>{createPath}</div>
        </div>
      </Dialog>
    </div>
  );
}

function Hint({ k, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <kbd style={{
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)',
        background: 'var(--surface)', border: '1px solid var(--border)', borderBottomWidth: 2,
        borderRadius: 'var(--radius-xs)', padding: '1px 6px', lineHeight: 1.4,
      }}>{k}</kbd>
      {label}
    </span>
  );
}
window.DevLogApp = DevLogApp;
