// DevLog app — the log thread (date-grouped entries + empty state).
function Thread({ entries, justAddedId }) {
  const { LogEntry, DateDivider } = window.DevLogDesignSystem_c9930f;

  if (entries.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--text-faint)',
      }}>
        no entries yet — start typing below
      </div>
    );
  }

  // group by date
  const groups = [];
  let cur = null;
  entries.forEach((e) => {
    if (!cur || cur.date !== e.date) { cur = { date: e.date, items: [] }; groups.push(cur); }
    cur.items.push(e);
  });

  return (
    <div style={{ paddingBottom: 8 }}>
      {groups.map((g) => (
        <div key={g.date}>
          <DateDivider date={g.date} sticky />
          {g.items.map((e) => (
            <div key={e.id} style={e.id === justAddedId ? { animation: 'devlog-entry-in var(--dur-slow) var(--ease-spring)' } : null}>
              <LogEntry
                status={e.status}
                title={e.title}
                time={e.time}
                context={e.context}
                body={e.body}
                onCopy={() => navigator.clipboard && navigator.clipboard.writeText(e.body)}
              />
            </div>
          ))}
        </div>
      ))}
      <style>{'@keyframes devlog-entry-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  );
}
window.Thread = Thread;
