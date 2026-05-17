import type {
  Task,
  TaskPriorityFilter,
  TaskSortOption,
  TaskStatusFilter,
} from "@/lib/tasks/types"

export interface TaskSummary {
  total: number
  pending: number
  completed: number
}

export interface TaskListFilters {
  searchQuery: string
  statusFilter: TaskStatusFilter
  priorityFilter: TaskPriorityFilter
}

export interface TaskListSort {
  sortBy: TaskSortOption
}

export function summarizeTasks(tasks: Task[]): TaskSummary {
  const completed = tasks.filter((task) => task.status === "completed").length
  const total = tasks.length

  return {
    total,
    completed,
    pending: total - completed,
  }
}

export function filterTasks(tasks: Task[], filters: TaskListFilters): Task[] {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase()

  return tasks.filter((task) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      task.title.toLowerCase().includes(normalizedQuery) ||
      task.description.toLowerCase().includes(normalizedQuery)

    const matchesStatus =
      filters.statusFilter === "all" || task.status === filters.statusFilter

    const matchesPriority =
      filters.priorityFilter === "all" || task.priority === filters.priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })
}

export function sortTasks(tasks: Task[], sort: TaskListSort): Task[] {
  if (sort.sortBy === "default") {
    return tasks
  }

  const sortedTasks = [...tasks].sort((firstTask, secondTask) =>
    firstTask.dueDate.localeCompare(secondTask.dueDate)
  )

  if (sort.sortBy === "due-date-desc") {
    return sortedTasks.reverse()
  }

  return sortedTasks
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function isTaskOverdue(task: Task, currentDate: Date = new Date()): boolean {
  if (task.status === "completed") {
    return false
  }

  const today = toDateOnlyString(currentDate)
  return task.dueDate < today
}
