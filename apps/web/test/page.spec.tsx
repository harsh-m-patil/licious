import Page from "@/app/page"
import { TASKS_STORAGE_KEY } from "@/lib/tasks/storage"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

describe("dashboard task workflow", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  test("renders semantic regions and empty-state guidance", () => {
    render(<Page />)

    expect(
      screen.getByRole("heading", { name: /task management dashboard/i })
    ).toBeTruthy()
    expect(screen.getByRole("banner")).toBeTruthy()
    expect(screen.getByRole("main")).toBeTruthy()

    expect(screen.getByRole("region", { name: /primary actions/i })).toBeTruthy()
    expect(
      screen.getByRole("region", { name: /search and filters/i })
    ).toBeTruthy()
    expect(screen.getByRole("region", { name: /task list/i })).toBeTruthy()
    expect(
      screen.getByRole("region", { name: /summary and metadata/i })
    ).toBeTruthy()

    expect(
      screen.getByText(/no tasks yet\. create your first task/i)
    ).toBeTruthy()
    expect(screen.getByText("Total tasks")).toBeTruthy()
    expect(screen.getByText("Pending tasks")).toBeTruthy()
    expect(screen.getByText("Completed tasks")).toBeTruthy()

    expect(screen.getByLabelText("Total tasks count").textContent).toBe("0")
    expect(screen.getByLabelText("Pending tasks count").textContent).toBe("0")
    expect(screen.getByLabelText("Completed tasks count").textContent).toBe("0")
  })

  test("creates a task, renders it in list view, and updates derived counts", () => {
    render(<Page />)

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Ship first workflow" },
    })
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Implement create + list + persistence" },
    })
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "high" },
    })
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-06-01" },
    })

    fireEvent.click(screen.getByRole("button", { name: /new task/i }))

    expect(screen.getByText("Ship first workflow")).toBeTruthy()
    expect(
      screen.getByText("Implement create + list + persistence")
    ).toBeTruthy()
    expect(screen.getByText("Pending")).toBeTruthy()
    const createdTaskRow = screen.getByText("Ship first workflow").closest("tr")
    expect(createdTaskRow).toBeTruthy()
    expect(createdTaskRow?.textContent).toContain("High")
    expect(screen.getByText("2026-06-01")).toBeTruthy()

    expect(screen.getByLabelText("Total tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Pending tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Completed tasks count").textContent).toBe("0")
  })

  test("blocks invalid submit with field-adjacent validation messages", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: /new task/i }))

    expect(screen.getByText("Title is required")).toBeTruthy()
    expect(screen.getByText("Description is required")).toBeTruthy()
    expect(screen.getByText("Due date is required")).toBeTruthy()
    expect(
      screen.getByText(/no tasks yet\. create your first task/i)
    ).toBeTruthy()
  })

  test("loads tasks from local storage", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Hydrate from storage",
        description: "Load persisted tasks on startup",
        priority: "medium",
        dueDate: "2026-06-02",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    render(<Page />)

    expect(screen.getByText("Hydrate from storage")).toBeTruthy()
  })

  test("starts editing an existing task from the list and prefills the form", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Edit me",
        description: "Existing task details",
        priority: "medium",
        dueDate: "2026-06-02",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Edit task Edit me" }))

    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe(
      "Edit me"
    )
    expect(
      (screen.getByLabelText("Description") as HTMLTextAreaElement).value
    ).toBe("Existing task details")
    expect((screen.getByLabelText("Priority") as HTMLSelectElement).value).toBe(
      "medium"
    )
    expect((screen.getByLabelText("Due date") as HTMLInputElement).value).toBe(
      "2026-06-02"
    )
    expect(
      screen.getByRole("button", { name: /save task changes/i })
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: /cancel edit/i })).toBeTruthy()
  })

  test("provides an accessible delete action and asks for confirmation", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Delete me",
        description: "Task to remove",
        priority: "medium",
        dueDate: "2026-06-02",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false)

    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Delete task Delete me" }))

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledWith(
      "Delete task \"Delete me\"? This action cannot be undone."
    )

    confirmSpy.mockRestore()
  })

  test("keeps task unchanged when deletion is cancelled", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Do not delete",
        description: "Task should remain",
        priority: "medium",
        dueDate: "2026-06-02",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false)

    render(<Page />)

    fireEvent.click(
      screen.getByRole("button", { name: "Delete task Do not delete" })
    )

    expect(screen.getByText("Do not delete")).toBeTruthy()
    expect(screen.getByLabelText("Total tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Pending tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Completed tasks count").textContent).toBe("0")

    const persistedTasks = JSON.parse(
      window.localStorage.getItem(TASKS_STORAGE_KEY) ?? "[]"
    ) as Array<{ title: string }>

    expect(persistedTasks).toHaveLength(1)
    expect(persistedTasks[0]?.title).toBe("Do not delete")

    confirmSpy.mockRestore()
  })

  test("deletes confirmed task, updates counts, and keeps it deleted after refresh", () => {
    const storedTasks = [
      {
        id: "task-1",
        title: "Completed item",
        description: "Done work",
        priority: "high",
        dueDate: "2026-06-03",
        status: "completed",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      {
        id: "task-2",
        title: "Pending item",
        description: "Open work",
        priority: "medium",
        dueDate: "2026-06-04",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTasks))

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true)

    const { unmount } = render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Delete task Completed item" }))

    expect(screen.queryByText("Completed item")).toBeNull()
    expect(screen.getByText("Pending item")).toBeTruthy()
    expect(screen.getByLabelText("Total tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Pending tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Completed tasks count").textContent).toBe("0")

    const persistedTasks = JSON.parse(
      window.localStorage.getItem(TASKS_STORAGE_KEY) ?? "[]"
    ) as Array<{ title: string }>

    expect(persistedTasks).toHaveLength(1)
    expect(persistedTasks[0]?.title).toBe("Pending item")

    unmount()
    render(<Page />)

    expect(screen.queryByText("Completed item")).toBeNull()
    expect(screen.getByText("Pending item")).toBeTruthy()

    confirmSpy.mockRestore()
  })

  test("cancelling edit keeps original task unchanged", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Original title",
        description: "Original description",
        priority: "low",
        dueDate: "2026-06-08",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Edit task Original title" }))

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Changed but cancelled" },
    })

    fireEvent.click(screen.getByRole("button", { name: /cancel edit/i }))

    expect(screen.getByText("Original title")).toBeTruthy()
    expect(screen.queryByText("Changed but cancelled")).toBeNull()

    const rawValue = window.localStorage.getItem(TASKS_STORAGE_KEY)
    expect(rawValue).toBeTruthy()

    const persistedTasks = JSON.parse(rawValue ?? "[]") as Array<{ title: string }>
    expect(persistedTasks).toHaveLength(1)
    expect(persistedTasks[0]?.title).toBe("Original title")
  })

  test("persists created tasks to local storage", () => {
    render(<Page />)

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Persist me" },
    })
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Save after create" },
    })
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "medium" },
    })
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-06-10" },
    })

    fireEvent.click(screen.getByRole("button", { name: /new task/i }))

    const rawValue = window.localStorage.getItem(TASKS_STORAGE_KEY)
    expect(rawValue).toBeTruthy()

    const persistedTasks = JSON.parse(rawValue ?? "[]") as Array<{
      title: string
      description: string
      priority: string
      dueDate: string
      status: string
    }>

    expect(persistedTasks).toHaveLength(1)
    expect(persistedTasks[0]).toMatchObject({
      title: "Persist me",
      description: "Save after create",
      priority: "medium",
      dueDate: "2026-06-10",
      status: "pending",
    })
  })

  test("blocks invalid edits and shows inline validation feedback", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Valid title",
        description: "Valid description",
        priority: "medium",
        dueDate: "2026-06-02",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Edit task Valid title" }))

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "" },
    })

    fireEvent.click(screen.getByRole("button", { name: /save task changes/i }))

    expect(screen.getByText("Title is required")).toBeTruthy()
    expect(screen.getByText("Valid title")).toBeTruthy()

    const rawValue = window.localStorage.getItem(TASKS_STORAGE_KEY)
    expect(rawValue).toBeTruthy()

    const persistedTasks = JSON.parse(rawValue ?? "[]") as Array<{ title: string }>
    expect(persistedTasks).toHaveLength(1)
    expect(persistedTasks[0]?.title).toBe("Valid title")
  })

  test("saves task edits and persists them to local storage", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Before edit",
        description: "Before description",
        priority: "medium",
        dueDate: "2026-06-02",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Edit task Before edit" }))

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "After edit" },
    })
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Updated description" },
    })
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "high" },
    })
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-06-10" },
    })

    fireEvent.click(screen.getByRole("button", { name: /save task changes/i }))

    expect(screen.getByText("After edit")).toBeTruthy()
    expect(screen.getByText("Updated description")).toBeTruthy()
    const editedRow = screen.getByText("After edit").closest("tr")
    expect(editedRow?.textContent).toContain("High")
    expect(screen.getByText("2026-06-10")).toBeTruthy()

    const rawValue = window.localStorage.getItem(TASKS_STORAGE_KEY)
    expect(rawValue).toBeTruthy()

    const persistedTasks = JSON.parse(rawValue ?? "[]") as Array<{
      title: string
      description: string
      priority: string
      dueDate: string
    }>

    expect(persistedTasks).toHaveLength(1)
    expect(persistedTasks[0]).toMatchObject({
      title: "After edit",
      description: "Updated description",
      priority: "high",
      dueDate: "2026-06-10",
    })
  })

  test("shows saved edits after refresh", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Refresh me",
        description: "Before refresh",
        priority: "low",
        dueDate: "2026-06-11",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    const { unmount } = render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Edit task Refresh me" }))
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Saved title" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save task changes/i }))

    unmount()
    render(<Page />)

    expect(screen.getByText("Saved title")).toBeTruthy()
  })

  test("renders pending and completed status styles from canonical task data", () => {
    const storedTasks = [
      {
        id: "task-pending",
        title: "Open item",
        description: "Needs work",
        priority: "low",
        dueDate: "2026-06-04",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      {
        id: "task-completed",
        title: "Closed item",
        description: "Already done",
        priority: "high",
        dueDate: "2026-06-05",
        status: "completed",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTasks))

    render(<Page />)

    const pendingRow = screen.getByText("Open item").closest("tr")
    const completedRow = screen.getByText("Closed item").closest("tr")

    expect(pendingRow).toBeTruthy()
    expect(completedRow).toBeTruthy()
    expect(pendingRow?.className).toContain("task-row-pending")
    expect(completedRow?.className).toContain("task-row-completed")

    expect(screen.getByLabelText("Total tasks count").textContent).toBe("2")
    expect(screen.getByLabelText("Pending tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Completed tasks count").textContent).toBe("1")
  })

  test("toggles task status, updates counts, and persists across refresh", () => {
    const storedTask = [
      {
        id: "task-1",
        title: "Toggle me",
        description: "Switch between states",
        priority: "medium",
        dueDate: "2026-06-12",
        status: "pending",
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ]

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storedTask))

    const { unmount } = render(<Page />)

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark task Toggle me as completed",
      })
    )

    expect(screen.getByText("Completed")).toBeTruthy()
    expect(screen.getByText("Toggle me").className).toContain("line-through")
    expect(screen.getByText("Toggle me").closest("tr")?.className).toContain(
      "task-row-completed"
    )
    expect(screen.getByLabelText("Pending tasks count").textContent).toBe("0")
    expect(screen.getByLabelText("Completed tasks count").textContent).toBe("1")

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark task Toggle me as pending",
      })
    )

    expect(screen.getByText("Pending")).toBeTruthy()
    expect(screen.getByText("Toggle me").className).not.toContain("line-through")
    expect(screen.getByText("Toggle me").closest("tr")?.className).toContain(
      "task-row-pending"
    )
    expect(screen.getByLabelText("Pending tasks count").textContent).toBe("1")
    expect(screen.getByLabelText("Completed tasks count").textContent).toBe("0")

    const persistedTasks = JSON.parse(
      window.localStorage.getItem(TASKS_STORAGE_KEY) ?? "[]"
    ) as Array<{ status: string }>

    expect(persistedTasks).toHaveLength(1)
    expect(persistedTasks[0]?.status).toBe("pending")

    unmount()
    render(<Page />)

    expect(screen.getByText("Pending")).toBeTruthy()
    expect(
      screen.getByRole("button", {
        name: "Mark task Toggle me as completed",
      })
    ).toBeTruthy()
  })

  test("falls back to empty list when storage payload is corrupt", () => {
    window.localStorage.setItem(TASKS_STORAGE_KEY, "{not-json")

    render(<Page />)

    expect(
      screen.getByText(/no tasks yet\. create your first task/i)
    ).toBeTruthy()
  })

  test("falls back to empty list when storage payload shape is invalid", () => {
    window.localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify([{ id: "bad-task-shape" }])
    )

    render(<Page />)

    expect(
      screen.getByText(/no tasks yet\. create your first task/i)
    ).toBeTruthy()
  })
})
