# Frontend Development Rules

Rules for `claude/frontend`. These are mandatory when writing or modifying frontend code.

## Data Fetching (React Query)

### Query Hooks

Every data-fetching feature MUST use `@tanstack/react-query` hooks. Direct `useEffect` + `fetch` is prohibited.

**Required for every `useQuery` hook:**

| Property | Rule |
|----------|------|
| `queryKey` | Use centralized query key factory from `src/constants/query-keys.ts`. Ad-hoc string arrays are prohibited |
| `staleTime` | Always set explicitly. Ask the user which value is appropriate for this data |
| `enabled` | Set conditional when the query depends on async state (e.g., auth token) |
| `select` | Use when the component only needs a subset of the response data |

**Required for every `useMutation` hook:**

| Callback | Rule |
|----------|------|
| `onSuccess` | Invalidate related query keys. Ask the user if optimistic update is needed |
| `onError` | Show user-facing error notification (toast). Never silently swallow errors |
| `onSettled` | Use for cleanup or refetch that should happen regardless of success/failure |

### Cache and Refetch Strategy

When implementing a new query, ASK the user about cache behavior:

1. **staleTime**: How fresh must this data be?
2. **refetchOnWindowFocus**: Should it refresh when the user returns to the tab?
3. **refetchInterval**: Does this data need periodic polling?
4. **gcTime**: How long should unused data stay in cache?

If the user does not specify, use these defaults:
- `staleTime: 60_000` (1 minute)
- `refetchOnWindowFocus: false`
- `retry: 1`
- `gcTime: 5 * 60 * 1000` (5 minutes)

### Query Key Factory

All query keys MUST be defined in `src/constants/query-keys.ts` using the factory pattern:

```typescript
export const EXAMPLE_KEY = {
    all: ['example'] as const,
    list: (params: ListParams) => [...EXAMPLE_KEY.all, 'list', params] as const,
    detail: (id: string) => [...EXAMPLE_KEY.all, 'detail', id] as const,
};
```

## UI State Handling

### Loading States (MANDATORY)

Every data-fetching component MUST handle the loading state visually. Ask the user which approach to use:

1. **Skeleton UI** — placeholder shapes matching the final layout
2. **Spinner/Indicator** — centered loading spinner
3. **Inline indicator** — loading text or small spinner next to the trigger

Never render an empty or broken layout while data is loading.

### Error States (MANDATORY)

Every data-fetching component MUST handle the error state:

- **Query errors (read)**: Show an error message with a retry button. Do not show a blank page
- **Mutation errors (write)**: Show a toast/alert notification explaining what failed
- **Network errors**: Distinguish from server errors when possible

### Empty States (MANDATORY)

When a query returns an empty array or no data, show a meaningful empty state:
- Descriptive message explaining why there's no data
- Action button if applicable (e.g., "Create your first view")

### Mutation Feedback (MANDATORY)

Every mutation (create, update, delete) MUST provide:

1. **Pending state**: Disable the submit button + show loading indicator
2. **Success feedback**: Toast notification, redirect, or visual confirmation
3. **Error feedback**: Toast notification with actionable error message

## Error Boundary

- Wrap major page sections with React Error Boundary to prevent full-app crashes
- Error boundaries should show a fallback UI with a retry/reload option

## Form Handling

- Client-side validation MUST run before API submission
- Show field-level error messages inline (not just a single alert)
- Preserve user input on validation failure — never clear the form on error

## Checklist (for self-verification)

Before considering a frontend feature complete, verify:

- [ ] All queries have loading UI (skeleton, spinner, or indicator)
- [ ] All queries have error UI (inline error + retry, or toast)
- [ ] All queries have empty state UI (when data is empty)
- [ ] All mutations disable the trigger during pending state
- [ ] All mutations show success/error feedback to the user
- [ ] Query keys use centralized factory pattern
- [ ] staleTime and cache behavior are explicitly configured
- [ ] Forms validate before submission and show field-level errors
- [ ] Error boundaries wrap major page sections
