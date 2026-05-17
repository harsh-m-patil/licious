import type { Priority, Status, TasksQuery } from "./types"

const TOKEN_PATTERN = /"([^"]+)"|(\S+)/g

const STATUS_ALIASES: Record<string, Status> = {
  open: "pending",
  opened: "pending",
  pending: "pending",
  todo: "pending",
  closed: "completed",
  complete: "completed",
  completed: "completed",
  done: "completed",
}

const PRIORITY_ALIASES: Record<string, Priority> = {
  low: "low",
  medium: "medium",
  med: "medium",
  high: "high",
}

export interface ParsedTasksSearch {
  query: TasksQuery
  tokens: string[]
}

const normalizeToken = (token: string) => token.replace(/^"|"$/g, "")

const parseStatus = (value: string): Status | undefined =>
  STATUS_ALIASES[value.toLowerCase()]

const parsePriority = (value: string): Priority | undefined =>
  PRIORITY_ALIASES[value.toLowerCase()]

export const parseTasksSearch = (input: string): ParsedTasksSearch => {
  const tokens = [...input.matchAll(TOKEN_PATTERN)]
    .map((match) => normalizeToken(match[1] ?? match[2] ?? ""))
    .filter(Boolean)

  const textTokens: string[] = []
  const query: TasksQuery = {}

  for (const token of tokens) {
    const separatorIndex = token.indexOf(":")

    if (separatorIndex === -1) {
      textTokens.push(token)
      continue
    }

    const key = token.slice(0, separatorIndex).toLowerCase()
    const value = token.slice(separatorIndex + 1)

    if (!value) {
      textTokens.push(token)
      continue
    }

    if (key === "status" || key === "state") {
      const status = parseStatus(value)

      if (status) {
        query.status = status
        continue
      }
    }

    if (key === "priority" || key === "prio") {
      const priority = parsePriority(value)

      if (priority) {
        query.priority = priority
        continue
      }
    }

    if (key === "is") {
      const status = parseStatus(value)

      if (status) {
        query.status = status
        continue
      }

      if (value === "issue" || value === "task") {
        continue
      }
    }

    textTokens.push(token)
  }

  if (textTokens.length > 0) {
    query.search = textTokens.join(" ")
  }

  return {
    query,
    tokens,
  }
}
