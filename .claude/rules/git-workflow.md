# Git Workflow

## Plan-First Development

For multi-step or multi-component tasks, the workflow is: **plan first, then issue, then code.**

```
1. User request
2. Run planner agent → implementation plan
3. User approves plan
4. Create GitHub issue (based on the plan)
5. Create branch
6. Implement following the plan
7. Code review + security review
8. Pre-PR checks (lint, build, test)
9. Commit + push + PR
```

For simple, single-file tasks, skip the planner and go directly to step 4.

## Issue Management

- Issues should represent large, meaningful task units — not individual file changes.
    - Good: "Add metamodel management API", "Implement agent outbox system", "Build canvas editor"
    - Bad: "Fix typo in button label", "Update import path" (these are commits, not issues)
- Reference the issue number in all related commits.

**When the user's prompt includes an issue number** (e.g., "#42: ...", "issue #42"):
- Use that issue number directly. Do NOT create a new issue.

**When the user's prompt does NOT include an issue number**:
- After the planner produces a plan (or immediately for simple tasks), ask the user whether to create a GitHub issue or proceed without one.

## Branch Naming Convention

| Prefix | Purpose | Examples |
|--------|---------|----------|
| `feat/(task-name)` | New features, feature improvements | `feat/canvas-editor`, `feat/agent-outbox` |
| `perf/(task-name)` | Performance optimization | `perf/sqlite-batch-write` |
| `fix/(task-name)` | Bug fixes | `fix/containment-validation` |
| `hot-fix/(task-name)` | Critical/urgent bug fixes | `hot-fix/agent-crash-on-reconnect` |
| `chore/(task-name)` | Config, docs, dependency updates | `chore/eslint-config`, `chore/update-deps` |
| `refact/(task-name)` | Code refactoring | `refact/api-layer`, `refact/state-management` |

**Do NOT include issue numbers in branch names.** Use descriptive task names instead.

## Commit Message Format

```
#<issue-number>: <Short task title>

<Summary of changes>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

- First line: issue number + concise title.
- Blank line, then a brief summary of what was changed and why.
- Commit messages and summaries in Korean.

## Branch & Merge Strategy

| Branch | Role | Merge Method |
|--------|------|--------------|
| `feat/*`, `fix/*`, `perf/*`, `chore/*`, `refact/*` | Task-level development | **Squash Merge** into `dev` via PR |
| `hot-fix/*` | Critical bug fixes | Direct commit to `dev` allowed |
| `dev` | Integration branch. **Never commit directly** except for `hot-fix` | **Regular Merge** into `main` |
| `main` | Production branch. **Never commit directly.** | — |

## Pre-PR Checks (MANDATORY)

Before creating a PR or pushing changes, Claude Code MUST perform:

1. **Rebase check**: Verify the branch is up to date with `dev`. If behind, rebase before proceeding.
2. **Conflict check**: After rebase, if conflicts occurred, warn the user and assist with resolution.
3. **Lint check**: Run lint and ensure zero warnings/errors.
4. **Test check**: Run `npm test` in affected components and ensure all tests pass.
5. **Build check**: Run build in affected components to verify success.

## Git Confirmation Rule

**Ask first:** `git add`, `git commit`, `git push`, `git rebase`, `git merge`, branch deletion, `gh issue create`, `gh pr create`

**Just do it:** `git status`, `git diff`, `git log`, `git fetch`, `gh issue view`, `gh pr view`, `gh api` (read-only)

When asking, display:
1. The command you intend to run
2. A summary of what will be affected (files, branch, target)

Proceed **only** after the user explicitly approves.

## Claude Code Attribution

- **Commits**: Always append `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` as the last line.
- **Issues**: Add `Created by Claude Code` at the bottom of the issue body.
- **Pull Requests**: Add `Generated with [Claude Code](https://claude.ai/code)` at the bottom of the PR body.

## Agent Workflow Integration

- **Sub-agents MUST NOT run any git commands.** No commit, push, branch, merge, or rebase.
- **Only the main Claude Code instance** performs git operations.
- Git operations happen **after** all sub-agent work is complete and the user confirms.
