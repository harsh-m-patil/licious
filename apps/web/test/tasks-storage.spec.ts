import { TASKS_STORAGE_KEY, loadTasks, saveTasks } from "@/lib/tasks/storage"
import type { Task } from "@/lib/tasks/types"
import { beforeEach, describe, expect, test, vi } from "vitest"

function createStoredTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Persisted task",
    description: "Loaded from storage",
    priority: "medium",
    dueDate: "2026-06-01",
    status: "pending",
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
    ...overrides,
  }
}

describe("task storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test("returns an empty list when no tasks are saved", () => {
    expect(loadTasks()).toEqual([])
  })

  test("loads valid saved tasks", () => {
    const tasks = [
      createStoredTask({ id: "task-1" }),
      createStoredTask({ id: "task-2", title: "Second task", status: "completed" }),
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))

    expect(loadTasks()).toEqual(tasks)
  })

  test("falls back to empty list when storage contains invalid JSON", () => {
    window.localStorage.setItem(TASKS_STORAGE_KEY, "{invalid-json")

    expect(loadTasks()).toEqual([])
  })

  test("falls back to empty list when stored payload is not an array", () => {
    window.localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify({ id: "not-an-array" })
    )

    expect(loadTasks()).toEqual([])
  })

  test("falls back to empty list when stored task shape is invalid", () => {
    window.localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify([{ id: "task-1", title: "Missing fields" }])
    )

    expect(loadTasks()).toEqual([])
  })

  test("saves tasks to local storage", () => {
    const tasks = [createStoredTask()]

    saveTasks(tasks)

    expect(window.localStorage.getItem(TASKS_STORAGE_KEY)).toBe(JSON.stringify(tasks))
  })

  test("does not throw when persistence fails during save", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota exceeded")
      })

    expect(() => saveTasks([createStoredTask()])).not.toThrow()

    setItemSpy.mockRestore()
  })
})
