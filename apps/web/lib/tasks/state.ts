import type { Task, TaskPriority, TaskState } from "@/lib/tasks/types"

export interface CreateTaskOptions {
  now?: string
  createTaskId?: () => string
}

export interface CreateTaskInput {
  title: string
  description: string
  priority: TaskPriority
  dueDate: string
}

export type CreateTaskValidationErrors = Partial<
  Record<keyof CreateTaskInput, string>
>

export const defaultTaskState: TaskState = {
  tasks: [],
  searchQuery: "",
  statusFilter: "all",
  priorityFilter: "all",
  sortBy: "default",
}

export function createInitialTaskState(
  overrides: Partial<TaskState> = {}
): TaskState {
  return {
    ...defaultTaskState,
    ...overrides,
  }
}

export function validateCreateTaskInput(
  input: CreateTaskInput
): CreateTaskValidationErrors {
  const errors: CreateTaskValidationErrors = {}

  if (!input.title.trim()) {
    errors.title = "Title is required"
  }

  if (!input.description.trim()) {
    errors.description = "Description is required"
  }

  if (!input.dueDate.trim()) {
    errors.dueDate = "Due date is required"
  }

  if (!input.priority) {
    errors.priority = "Priority is required"
  }

  return errors
}

export function hasCreateTaskValidationErrors(
  errors: CreateTaskValidationErrors
): boolean {
  return Object.keys(errors).length > 0
}

function createTaskId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createTask(
  input: CreateTaskInput,
  options: CreateTaskOptions = {}
): Task {
  const now = options.now ?? new Date().toISOString()

  return {
    id: options.createTaskId?.() ?? createTaskId(),
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
    dueDate: input.dueDate,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }
}
