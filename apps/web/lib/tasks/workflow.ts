import {
  createTask,
  type CreateTaskInput,
  type CreateTaskValidationErrors,
  hasCreateTaskValidationErrors,
  validateCreateTaskInput,
} from "@/lib/tasks/state"
import type { Task } from "@/lib/tasks/types"

export interface TaskWorkflowState {
  tasks: Task[]
  draft: CreateTaskInput
  errors: CreateTaskValidationErrors
  editingTaskId: string | null
  feedbackMessage: string
}

export interface TaskWorkflowOptions {
  now?: string
  createTaskId?: () => string
}

export const defaultTaskDraft: CreateTaskInput = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
}

export function createTaskWorkflowState(tasks: Task[] = []): TaskWorkflowState {
  return {
    tasks,
    draft: defaultTaskDraft,
    errors: {},
    editingTaskId: null,
    feedbackMessage: "",
  }
}

export function updateTaskWorkflowDraft<K extends keyof CreateTaskInput>(
  state: TaskWorkflowState,
  key: K,
  value: CreateTaskInput[K]
): TaskWorkflowState {
  const nextErrors = { ...state.errors }
  delete nextErrors[key]

  return {
    ...state,
    draft: {
      ...state.draft,
      [key]: value,
    },
    errors: nextErrors,
  }
}

export function startTaskEditing(
  state: TaskWorkflowState,
  taskId: string
): TaskWorkflowState {
  const task = state.tasks.find((currentTask) => currentTask.id === taskId)

  if (!task) {
    return state
  }

  return {
    ...state,
    editingTaskId: task.id,
    draft: toTaskDraft(task),
    errors: {},
  }
}

export function cancelTaskEditing(state: TaskWorkflowState): TaskWorkflowState {
  return {
    ...state,
    draft: defaultTaskDraft,
    errors: {},
    editingTaskId: null,
  }
}

export function submitTaskWorkflow(
  state: TaskWorkflowState,
  options: TaskWorkflowOptions = {}
): TaskWorkflowState {
  const validationErrors = validateCreateTaskInput(state.draft)

  if (hasCreateTaskValidationErrors(validationErrors)) {
    return {
      ...state,
      errors: validationErrors,
    }
  }

  if (state.editingTaskId) {
    const now = options.now ?? new Date().toISOString()

    return {
      tasks: state.tasks.map((task) =>
        task.id === state.editingTaskId
          ? {
              ...task,
              ...state.draft,
              updatedAt: now,
            }
          : task
      ),
      draft: defaultTaskDraft,
      errors: {},
      editingTaskId: null,
      feedbackMessage: "Task updated successfully",
    }
  }

  const nextTask = createTask(state.draft, options)

  return {
    tasks: [nextTask, ...state.tasks],
    draft: defaultTaskDraft,
    errors: {},
    editingTaskId: null,
    feedbackMessage: "Task created successfully",
  }
}

export function toggleTaskWorkflowStatus(
  state: TaskWorkflowState,
  taskId: string,
  options: TaskWorkflowOptions = {}
): TaskWorkflowState {
  const now = options.now ?? new Date().toISOString()

  return {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) {
        return task
      }

      return {
        ...task,
        status: task.status === "completed" ? "pending" : "completed",
        updatedAt: now,
      }
    }),
  }
}

export function deleteTaskFromWorkflow(
  state: TaskWorkflowState,
  taskId: string
): TaskWorkflowState {
  const isEditingDeletedTask = state.editingTaskId === taskId

  return {
    tasks: state.tasks.filter((task) => task.id !== taskId),
    draft: isEditingDeletedTask ? defaultTaskDraft : state.draft,
    errors: isEditingDeletedTask ? {} : state.errors,
    editingTaskId: isEditingDeletedTask ? null : state.editingTaskId,
    feedbackMessage: "Task deleted successfully",
  }
}

function toTaskDraft(task: Task): CreateTaskInput {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
  }
}
