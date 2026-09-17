# Feature components implementation plan

Status: proposed; implementation has not started.

## Scope and placement

Build the first desktop product components around the existing `Entry`, `Context`,
and `CaptureDraft` domain models in `@devlog/core`. Product components and state
belong in `apps/desktop/src/features`; reusable UI primitives remain in
`packages/ui`.

## Implementation order

1. Add an entry composer with controlled content and context selection, submit
   callbacks, and pending/error states. Reuse `normalizeEntryContent` at the
   submission boundary and preserve the draft when submission fails.
2. Add entry list and entry item components, including empty and loading states.
   Keep data access outside the rendering components and receive entries through
   props.
3. Add context navigation and selection using the existing parent-child model.
   Support entries without a context and reuse `normalizeContextName` wherever
   context creation is introduced.
4. Assemble the components in the desktop shell with local fixture data and
   in-memory interactions so the capture and context-switching flow can be
   reviewed before persistence is connected.

## Validation

Run workspace lint, typecheck, and build checks after implementation. Add focused
behavior tests for submission validation, failed-submit draft preservation, and
context selection. Manually check keyboard navigation, focus, and empty/loading/
error states in the desktop UI.

## Later work

Database persistence, Tauri commands, and a separate quick-capture window are
outside this initial component pass. This draft PR currently contains only this
plan and does not add product functionality.
