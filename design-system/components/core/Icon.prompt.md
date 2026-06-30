# Icon

Lucide icon — the DevLog icon primitive. Use anywhere you need an icon.

```jsx
<Icon name="copy" size={18} />
<Icon name="zap" size={14} color="var(--accent)" />
```

Names are [Lucide](https://lucide.dev) names in kebab-case (`panel-left-open`, `chevron-right`, `at-sign`) or PascalCase. Stroke 2 by default; pass `stroke` to adjust. Requires the Lucide UMD global on the page: `<script src="https://unpkg.com/lucide@latest"></script>` before the bundle.
