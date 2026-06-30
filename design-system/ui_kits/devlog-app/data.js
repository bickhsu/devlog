// DevLog UI kit — seed data. Context tree, sidebar tree, and a thread of log entries.
window.DevLogData = (function () {
  // Flat list of every context path (for the "/" palette).
  const PATHS = [
    '/metai/cad-agent/adapter',
    '/metai/cad-agent/adapter/migration-test',
    '/metai/cad-agent/adapter/flowchart-explanation',
    '/metai/cad-agent/ai-team',
    '/metai/cad-agent/meeting',
    '/metai/cad-agent',
    '/metai/metgen',
    '/metai/hython-server',
    '/metai/building-gen',
    '/metai/cad-parser',
    '/metai/kinopio-test',
  ];

  // Nested tree for the column picker. null = leaf.
  const TREE = {
    metai: {
      'cad-agent': {
        adapter: { 'migration-test': null, 'flowchart-explanation': null },
        'ai-team': null,
        meeting: null,
      },
      metgen: null,
      'hython-server': null,
      'building-gen': null,
      'cad-parser': null,
      'kinopio-test': null,
    },
  };

  // Sidebar tree (display labels).
  const SIDEBAR = [
    {
      label: 'Daily', path: '/', defaultOpen: true, children: [
        {
          label: 'metai', path: '/metai', defaultOpen: true, children: [
            {
              label: 'cad-agent', path: '/metai/cad-agent', defaultOpen: true, children: [
                {
                  label: 'adapter', path: '/metai/cad-agent/adapter', defaultOpen: true, children: [
                    { label: 'migration-test', path: '/metai/cad-agent/adapter/migration-test' },
                    { label: 'flowchart-explanation', path: '/metai/cad-agent/adapter/flowchart-explanation' },
                  ]
                },
                { label: 'ai-team', path: '/metai/cad-agent/ai-team' },
                { label: 'meeting', path: '/metai/cad-agent/meeting' },
              ]
            },
            { label: 'metgen', path: '/metai/metgen' },
            { label: 'hython-server', path: '/metai/hython-server' },
            { label: 'building-gen', path: '/metai/building-gen' },
            { label: 'cad-parser', path: '/metai/cad-parser' },
            { label: 'kinopio-test', path: '/metai/kinopio-test' },
          ]
        },
      ]
    },
  ];

  // Seed log entries (newest last). context-scoped.
  const ENTRIES = [
    {
      id: 1, date: '2026/06/10', time: '09:41', context: '/metai/cad-agent', status: 'note',
      body: 'Mapped the full CAD Agent → hython workflow data flow:\nRaw DXF / DWG ➔ CAD Agent does semantic parsing + classification ➔ emits IR JSON and a standardized DXF redraw ➔ CAD Parser turns the standard DXF into block / polyline / mline JSON',
    },
    {
      id: 2, date: '2026/06/12', time: '11:04', context: '/metai/cad-agent/adapter', status: 'done',
      title: 'BuildingSchemaAdapter',
      body: 'Set up the BuildingSchemaAdapter repo, wired CAD Parser to BuildingGen, and converged it into a runnable CLI workflow.',
    },
    {
      id: 3, date: '2026/06/12', time: '14:32', context: '/metai/cad-agent/adapter/migration-test', status: 'progress',
      title: 'CAD Agent',
      body: 'Helping the AI Team test CAD Agent against the hython workflow\nCollecting more failing sample DXF cases\nNailing down the field mapping from IR JSON to BuildingRequest',
    },
    {
      id: 4, date: '2026/06/12', time: '16:58', context: '/metai/hython-server', status: 'note',
      body: 'Next: design a --to-hython-schema step that emits the BuildingRequest hython-server consumes directly, cutting intermediate artifacts and format-conversion cost.',
    },
    {
      id: 5, date: '2026/06/13', time: '10:15', context: '/metai/cad-agent/adapter', status: 'failed',
      title: 'Data repair + normalization',
      body: 'While testing CAD Agent output, found some downstream-required fields missing, so added a fixer utility to repair and normalize the data.\n→ backfill missing fields\n→ normalize object naming\n→ add floor metadata fallback',
    },
  ];

  return { PATHS, TREE, SIDEBAR, ENTRIES };
})();
