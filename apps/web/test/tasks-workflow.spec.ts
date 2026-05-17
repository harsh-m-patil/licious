import type { Task } from "@/lib/tasks/types"
import {
  cancelTaskEditing,
  createTaskWorkflowState,
  deleteTaskFromWorkflow,
  startTaskEditing,
  submitTaskWorkflow,
  toggleTaskWorkflowStatus,
  updateTaskWorkflowDraft,
} from "@/lib/tasks/workflow"
import { describe, expect, test } from "vitest"

function createTaskFixture(overrides: Partial<Task> = {}): Task {
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

describe("task workflow", () => {
  test("creates workflow state from canonical task data", () => {
    const tasks = [createTaskFixture()]

    expect(createTaskWorkflowState(tasks)).toEqual({
      tasks,
      draft: {
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      },
      errors: {},
      editingTaskId: null,
      feedbackMessage: "",
    })
  })

  test("updates draft fields and clears field-adjacent validation errors", () => {
    const state = submitTaskWorkflow(createTaskWorkflowState())

    const nextState = updateTaskWorkflowDraft(state, "title", "Wire workflow module")

    expect(nextState.draft.title).toBe("Wire workflow module")
    expect(nextState.errors.title).toBeUndefined()
    expect(nextState.errors.description).toBe("Description is required")
    expect(nextState.errors.dueDate).toBe("Due date is required")
  })

  test("creates a pending task and resets draft state on submit", () => {
    let state = createTaskWorkflowState()
    state = updateTaskWorkflowDraft(state, "title", "Ship workflow")
    state = updateTaskWorkflowDraft(state, "description", "Deepen task module")
    state = updateTaskWorkflowDraft(state, "priority", "high")
    state = updateTaskWorkflowDraft(state, "dueDate", "2026-06-03")

    const nextState = submitTaskWorkflow(state, {
      now: "2026-05-16T00:00:00.000Z",
      createTaskId: () => "task-new",
    })

    expect(nextState.tasks).toHaveLength(1)
    expect(nextState.tasks[0]).toMatchObject({
      id: "task-new",
      title: "Ship workflow",
      description: "Deepen task module",
      priority: "high",
      dueDate: "2026-06-03",
      status: "pending",
      createdAt: "2026-05-16T00:00:00.000Z",
      updatedAt: "2026-05-16T00:00:00.000Z",
    })
    expect(nextState.draft).toEqual({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    })
    expect(nextState.feedbackMessage).toBe("Task created successfully")
  })

  test("starts editing from canonical task data and cancels back to a clean draft", () => {
    const state = createTaskWorkflowState([
      createTaskFixture({
        id: "task-1",
        title: "Edit me",
        description: "Existing task details",
        priority: "low",
        dueDate: "2026-06-05",
      }),
    ])

    const editingState = startTaskEditing(state, "task-1")

    expect(editingState.editingTaskId).toBe("task-1")
    expect(editingState.draft).toEqual({
      title: "Edit me",
      description: "Existing task details",
      priority: "low",
      dueDate: "2026-06-05",
    })

    const cancelledState = cancelTaskEditing(editingState)

    expect(cancelledState.editingTaskId).toBeNull()
    expect(cancelledState.errors).toEqual({})
    expect(cancelledState.draft).toEqual({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    })
  })

  test("saves edits to an existing task and clears the edit session", () => {
    const initialState = createTaskWorkflowState([
      createTaskFixture({
        id: "task-1",
        title: "Before edit",
        description: "Before description",
        priority: "medium",
        dueDate: "2026-06-02",
      }),
    ])

    let editingState = startTaskEditing(initialState, "task-1")
    editingState = updateTaskWorkflowDraft(editingState, "title", "After edit")
    editingState = updateTaskWorkflowDraft(
      editingState,
      "description",
      "Updated description"
    )
    editingState = updateTaskWorkflowDraft(editingState, "priority", "high")
    editingState = updateTaskWorkflowDraft(editingState, "dueDate", "2026-06-10")

    const nextState = submitTaskWorkflow(editingState, {
      now: "2026-05-16T00:00:00.000Z",
    })

    expect(nextState.editingTaskId).toBeNull()
    expect(nextState.feedbackMessage).toBe("Task updated successfully")
    expect(nextState.tasks[0]).toMatchObject({
      id: "task-1",
      title: "After edit",
      description: "Updated description",
      priority: "high",
      dueDate: "2026-06-10",
      updatedAt: "2026-05-16T00:00:00.000Z",
    })
  })

  test("toggles status and updates the canonical task timestamp", () => {
    const state = createTaskWorkflowState([
      createTaskFixture({
        id: "task-1",
        status: "pending",
        updatedAt: "2026-05-15T00:00:00.000Z",
      }),
    ])

    const nextState = toggleTaskWorkflowStatus(state, "task-1", {
      now: "2026-05-16T00:00:00.000Z",
    })

    expect(nextState.tasks[0]?.status).toBe("completed")
    expect(nextState.tasks[0]?.updatedAt).toBe("2026-05-16T00:00:00.000Z")
  })

  test("deletes a task and cancels its edit session if needed", () => {
    const initialState = createTaskWorkflowState([
      createTaskFixture({ id: "task-1", title: "Delete me" }),
      createTaskFixture({ id: "task-2", title: "Keep me" }),
    ])

    const editingState = startTaskEditing(initialState, "task-1")
    const nextState = deleteTaskFromWorkflow(editingState, "task-1")

    expect(nextState.tasks.map((task) => task.id)).toEqual(["task-2"])
    expect(nextState.editingTaskId).toBeNull()
    expect(nextState.draft.title).toBe("")
    expect(nextState.feedbackMessage).toBe("Task deleted successfully")
  })
})
