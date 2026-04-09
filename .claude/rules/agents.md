# Agent Orchestration

## Available Agents

### Project agents (`.claude/agents/`)

| Agent             | Purpose                 | When to Use                                |
| ----------------- | ----------------------- | ------------------------------------------ |
| planner           | Implementation planning | Before starting multi-step or multi-component tasks |
| code-reviewer     | Code review             | After writing code                         |
| security-reviewer | Security analysis       | Before commits, auth/data handling changes |

## Immediate Agent Usage

No user prompt needed:

1. Multi-step or multi-component task — Use **planner** agent first
2. Code just written/modified — Use **code-reviewer** agent

## Built-in Tool Overrides

- DO NOT use `EnterPlanMode`. Always use the **planner** agent via `Task` tool (subagent_type: `planner`) instead. The planner agent has project-specific planning processes and output formats that `EnterPlanMode` does not provide.
- DO NOT use the built-in `Plan` subagent type. Use the project's **planner** agent which loads `.claude/agents/planner.md`.

## Agent Rules

- Sub-agents MUST NOT run git commands. Only the main agent performs git operations.
- Sub-agent output must follow the format defined in each agent's Output Format section.
- When reporting review results to the user, only surface actionable issues. Do NOT relay routine code-level feedback (style, naming, minor improvements) — this wastes context window. Focus on: critical bugs, security issues, schema mismatches, and rule violations.

## Invoking Sub-Agents

When calling a sub-agent via the Task tool, the main agent MUST include these in the prompt:

1. **Task context**: Brief description of what was done (1-2 sentences)
2. **Changed files**: List of created/modified file paths (absolute paths)
3. **Affected components**: Which components were touched (frontend / backend / agent)

The sub-agent reads files directly using its own tools. Do NOT paste code or diffs into the prompt.

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Code review of backend API
3. Agent 3: Code review of frontend components

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```
