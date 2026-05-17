import type { Task, TaskPriority, TaskStatus } from "@/lib/tasks/types"

export const TASKS_STORAGE_KEY = "licious.tasks.v1"

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "low" || value === "medium" || value === "high"
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "pending" || value === "completed"
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") {
    return false
  }

  const task = value as Record<string, unknown>

  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    isTaskPriority(task.priority) &&
    typeof task.dueDate === "string" &&
    isTaskStatus(task.status) &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string"
  )
}

export function loadTasks(): Task[] {
  if (typeof window === "undefined") {
    return []
  }

  const rawValue = window.localStorage.getItem(TASKS_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    if (!parsedValue.every(isTask)) {
      return []
    }

    return parsedValue
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // ignore persistence failures (e.g. quota or restricted mode)
  }
}
