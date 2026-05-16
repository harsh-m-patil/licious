import type { Task } from "@/lib/tasks/types"
import { filterTasks, summarizeTasks } from "@/lib/tasks/utils"
import { describe, expect, test } from "vitest"

function createTask(overrides: Partial<Task>): Task {
  return {
    id: "task-1",
    title: "Default title",
    description: "Default description",
    priority: "medium",
    dueDate: "2026-06-01",
    status: "pending",
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
    ...overrides,
  }
}

describe("task utils", () => {
  test("summarizes total, pending, and completed counts", () => {
    const tasks: Task[] = [
      createTask({ id: "task-1", status: "pending" }),
      createTask({ id: "task-2", status: "completed" }),
      createTask({ id: "task-3", status: "pending" }),
    ]

    expect(summarizeTasks(tasks)).toEqual({
      total: 3,
      pending: 2,
      completed: 1,
    })
  })

  test("filters by status", () => {
    const tasks: Task[] = [
      createTask({ id: "task-1", title: "Pending task", status: "pending" }),
      createTask({ id: "task-2", title: "Completed task", status: "completed" }),
    ]

    const filtered = filterTasks(tasks, {
      searchQuery: "",
      statusFilter: "completed",
      priorityFilter: "all",
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe("task-2")
  })

  test("filters by priority", () => {
    const tasks: Task[] = [
      createTask({ id: "task-1", title: "Low", priority: "low" }),
      createTask({ id: "task-2", title: "High", priority: "high" }),
    ]

    const filtered = filterTasks(tasks, {
      searchQuery: "",
      statusFilter: "all",
      priorityFilter: "high",
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe("task-2")
  })

  test("matches search query against title and description case-insensitively", () => {
    const tasks: Task[] = [
      createTask({
        id: "task-1",
        title: "Fix auth callback",
        description: "Production bug",
      }),
      createTask({
        id: "task-2",
        title: "Write docs",
        description: "Document AUTH flow",
      }),
      createTask({
        id: "task-3",
        title: "No match",
        description: "Irrelevant",
      }),
    ]

    const filtered = filterTasks(tasks, {
      searchQuery: " AuTh ",
      statusFilter: "all",
      priorityFilter: "all",
    })

    expect(filtered.map((task) => task.id)).toEqual(["task-1", "task-2"])
  })

  test("applies combined search, status, and priority filters", () => {
    const tasks: Task[] = [
      createTask({
        id: "task-1",
        title: "Fix auth callback",
        description: "Production issue",
        status: "pending",
        priority: "high",
      }),
      createTask({
        id: "task-2",
        title: "Fix auth callback",
        description: "Already done",
        status: "completed",
        priority: "high",
      }),
      createTask({
        id: "task-3",
        title: "Fix auth callback",
        description: "Lower priority",
        status: "pending",
        priority: "low",
      }),
    ]

    const filtered = filterTasks(tasks, {
      searchQuery: "auth",
      statusFilter: "pending",
      priorityFilter: "high",
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe("task-1")
  })
})
