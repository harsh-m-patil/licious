"use client"

import { useMemo, useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, X } from "lucide-react"

import {
  CreateTaskDialog,
  DeleteTaskButton,
  EditTaskDialog,
} from "@/components/create-task-dialog"
import { ModeToggle } from "@/components/mode-toggle"
import { createLocalStorageTasksStorage } from "@/lib/tasks/adapters/localStorage"
import { tasksKeys, tasksListQueryOptions } from "@/lib/tasks/queries"
import { parseTasksSearch } from "@/lib/tasks/search"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@workspace/ui/components/input-group"

const tasksStorage = createLocalStorageTasksStorage()

const priorityBadgeStyles = {
  low: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300",
  medium:
    "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300",
  high: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300",
} as const

function getTodayDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export default function Page() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)
  const debouncedSearchInput = useDebouncedValue(searchInput, 300)
  const parsedSearch = useMemo(
    () => parseTasksSearch(searchInput),
    [searchInput]
  )
  const debouncedParsedSearch = useMemo(
    () => parseTasksSearch(debouncedSearchInput),
    [debouncedSearchInput]
  )

  const {
    data: allTasks = [],
    isLoading: isLoadingAllTasks,
    isError: isAllTasksError,
    error: allTasksError,
  } = useQuery(tasksListQueryOptions())
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery(tasksListQueryOptions(debouncedParsedSearch.query))

  const isSearching = searchInput.trim().length > 0
  const isDebouncing = searchInput !== debouncedSearchInput
  const todayDateKey = getTodayDateKey()

  const handleSeedTasks = async () => {
    try {
      setIsSeeding(true)
      setSeedError(null)
      await tasksStorage.seedTasks()
      await queryClient.invalidateQueries({ queryKey: tasksKeys.all })
    } catch (error) {
      setSeedError(
        error instanceof Error ? error.message : "Failed to seed tasks."
      )
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex gap-3">
        <InputGroup className="h-10">
          <InputGroupAddon>
            <InputGroupText>
              <Search className="size-4" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search tasks… try status:completed priority:high"
            className="h-10"
          />
          {isSearching ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => setSearchInput("")}
              >
                <X className="size-3.5" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <CreateTaskDialog />
      </div>

      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            {isDebouncing ? " Waiting for you to stop typing..." : ""}
            {!isDebouncing && isFetching ? " Refreshing results..." : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {tasks.length} visible{allTasks.length !== tasks.length
              ? ` of ${allTasks.length}`
              : ""}
          </Badge>
          <ModeToggle />
        </div>
      </div>

      {isSearching ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {parsedSearch.tokens.map((token) => (
            <Badge key={token} variant="outline">
              {token}
            </Badge>
          ))}
        </div>
      ) : null}

      {isLoading || isLoadingAllTasks ? (
        <p className="text-muted-foreground text-sm">Loading tasks...</p>
      ) : isError || isAllTasksError ? (
        <p className="text-destructive text-sm">
          Failed to load tasks: {(error ?? allTasksError)?.message}
        </p>
      ) : tasks.length === 0 ? (
        allTasks.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No tasks yet</EmptyTitle>
              <EmptyDescription>
                Add your first task, or seed the list with sample tasks.
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex flex-col items-center gap-3">
              <Button onClick={handleSeedTasks} disabled={isSeeding}>
                {isSeeding ? "Seeding..." : "Seed tasks"}
              </Button>
              {seedError ? (
                <p className="text-destructive text-sm">{seedError}</p>
              ) : null}
            </div>
          </Empty>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No matching tasks</EmptyTitle>
              <EmptyDescription>
                Try a different search, or clear a qualifier like status:completed.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => {
            const isPastDue =
              task.status === "pending" && task.dueDate < todayDateKey

            return (
              <Card
                key={task.id}
                className={cn(
                  task.status === "completed" && "opacity-65",
                  isPastDue
                    ? "ring-2 ring-destructive/80"
                    : task.status === "pending" && "ring-2 ring-primary/70"
                )}
              >
                  <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{task.title}</CardTitle>
                      <CardDescription>{task.dueDate}</CardDescription>
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {task.description ?? "No description"}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={priorityBadgeStyles[task.priority]}>
                      {task.priority}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <EditTaskDialog task={task} />
                      <DeleteTaskButton task={task} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
