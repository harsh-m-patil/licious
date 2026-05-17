import {
  type Task,
  type TaskPriority,
  type TaskState,
  type TaskStatus,
} from "@/lib/tasks/types"
import {
  createInitialTaskState,
  createTask,
  hasCreateTaskValidationErrors,
  validateCreateTaskInput,
} from "@/lib/tasks/state"
import { filterTasks, summarizeTasks } from "@/lib/tasks/utils"
import { describe, expect, test } from "vitest"

describe("task domain contracts", () => {
  test("provides stable task-state defaults for future slices", () => {
    const state = createInitialTaskState()

    expect(state).toEqual({
      tasks: [],
      searchQuery: "",
      statusFilter: "all",
      priorityFilter: "all",
      sortBy: "default",
    })
  })

  test("summarizes task metadata from public task type", () => {
    const pendingTask: Task = {
      id: "task-1",
      title: "Design shell",
      description: "Create semantic shell",
      priority: "medium",
      dueDate: "2026-05-20",
      status: "pending",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    }

    const completedTask: Task = {
      ...pendingTask,
      id: "task-2",
      status: "completed",
    }

    expect(summarizeTasks([pendingTask, completedTask])).toEqual({
      total: 2,
      pending: 1,
      completed: 1,
    })
  })

  test("filters task lists by search, status, and priority", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        title: "Auth flow",
        description: "Fix callback",
        priority: "high",
        dueDate: "2026-05-20",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      {
        id: "task-2",
        title: "Docs",
        description: "Auth user guide",
        priority: "low",
        dueDate: "2026-05-21",
        status: "completed",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    const filtered = filterTasks(tasks, {
      searchQuery: "AUTH",
      statusFilter: "pending",
      priorityFilter: "high",
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe("task-1")
  })

  test("keeps priority and status unions constrained", () => {
    const priority: TaskPriority = "high"
    const status: TaskStatus = "completed"
    const state: TaskState = createInitialTaskState({
      priorityFilter: priority,
      statusFilter: status,
    })

    expect(state.priorityFilter).toBe("high")
    expect(state.statusFilter).toBe("completed")
  })

  test("creates pending tasks from the task creation interface", () => {
    const task = createTask({
      title: "Wire create flow",
      description: "Use canonical task contract",
      priority: "low",
      dueDate: "2026-06-03",
    })

    expect(task.title).toBe("Wire create flow")
    expect(task.description).toBe("Use canonical task contract")
    expect(task.priority).toBe("low")
    expect(task.dueDate).toBe("2026-06-03")
    expect(task.status).toBe("pending")
    expect(task.id).toBeTruthy()
  })

  test("validates required create-task input", () => {
    const errors = validateCreateTaskInput({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    })

    expect(hasCreateTaskValidationErrors(errors)).toBe(true)
    expect(errors).toEqual({
      title: "Title is required",
      description: "Description is required",
      dueDate: "Due date is required",
    })
  })
})
