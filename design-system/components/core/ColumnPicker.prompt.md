# ColumnPicker

Finder-style cascading column picker for drilling a context tree (from cd+Tab or clicking the badge).

```jsx
<ColumnPicker tree={tree} path={['metai','cad-agent','adapter']}
  onSelect={setPath} onCommit={switchContext} />
```

tree is nested { segment: subtreeOrNull }; null = leaf.
