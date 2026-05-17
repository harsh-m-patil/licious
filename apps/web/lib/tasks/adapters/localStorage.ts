import { tasks as seedTaskData } from "../data"
import type {
  CreateTaskInput,
  Task,
  TaskId,
  TasksQuery,
  TasksStorage,
  UpdateTaskInput,
} from "../types"

const DEFAULT_STORAGE_KEY = "licious.tasks.v1"

const matchesQuery = (task: Task, query?: TasksQuery) => {
  if (!query) return true

  if (query.status && task.status !== query.status) {
    return false
  }

  if (query.priority && task.priority !== query.priority) {
    return false
  }

  if (query.search) {
    const search = query.search.toLowerCase()
    const haystack = [task.title, task.description ?? "", task.dueDate]
      .join(" ")
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  return true
}

const sortTasks = (items: Task[]) =>
  [...items].sort((left, right) => {
    if (left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate)
    }

    return left.title.localeCompare(right.title)
  })

class LocalStorageTasksStorage implements TasksStorage {
  constructor(private readonly storageKey = DEFAULT_STORAGE_KEY) {}

  async list(query?: TasksQuery): Promise<Task[]> {
    return sortTasks(
      this.readTasks().filter((task) => matchesQuery(task, query))
    )
  }

  async get(id: TaskId): Promise<Task | null> {
    return this.readTasks().find((task) => task.id === id) ?? null
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const nextTask: Task = {
      id: this.createId(),
      ...input,
    }

    const tasks = this.readTasks()
    tasks.push(nextTask)
    this.writeTasks(tasks)

    return nextTask
  }

  async update(id: TaskId, input: UpdateTaskInput): Promise<Task> {
    const tasks = this.readTasks()
    const currentTask = tasks.find((task) => task.id === id)

    if (!currentTask) {
      throw new Error(`Task not found: ${id}`)
    }

    const updatedTask: Task = {
      ...currentTask,
      ...input,
      id,
    }

    this.writeTasks(tasks.map((task) => (task.id === id ? updatedTask : task)))

    return updatedTask
  }

  async remove(id: TaskId): Promise<void> {
    const tasks = this.readTasks()
    const nextTasks = tasks.filter((task) => task.id !== id)

    if (nextTasks.length === tasks.length) {
      throw new Error(`Task not found: ${id}`)
    }

    this.writeTasks(nextTasks)
  }

  async seedTasks(): Promise<Task[]> {
    const tasks = [...seedTaskData]
    this.writeTasks(tasks)
    return tasks
  }

  private getStorage(): Storage {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available outside the browser")
    }

    return window.localStorage
  }

  private readTasks(): Task[] {
    const storage = this.getStorage()
    const raw = storage.getItem(this.storageKey)

    if (!raw) {
      const initialTasks = [...seedTaskData]
      this.writeTasks(initialTasks)
      return initialTasks
    }

    try {
      const parsed = JSON.parse(raw) as Task[]
      return Array.isArray(parsed) ? parsed : [...seedTaskData]
    } catch {
      const initialTasks = [...seedTaskData]
      this.writeTasks(initialTasks)
      return initialTasks
    }
  }

  private writeTasks(tasks: Task[]): void {
    this.getStorage().setItem(this.storageKey, JSON.stringify(tasks))
  }

  private createId(): TaskId {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID()
    }

    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export const createLocalStorageTasksStorage = (
  storageKey?: string
): TasksStorage => new LocalStorageTasksStorage(storageKey)
