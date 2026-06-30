# Composer

The log composer — context badge pinned top-left + multiline input. The product's primary input. ⌘/Ctrl+Enter or the send button submits.

```jsx
<Composer context="/metai/cad-agent/adapter"
  onSubmit={addEntry} onBadgeClick={openPicker} badgeActive={pickerOpen}
  popover={pickerOpen && <ColumnPicker .../>} />
```

Pass popover to float a CommandList / ColumnPicker above it.
