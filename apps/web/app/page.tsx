"use client"

import { useMemo, useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"

import { useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"

import { tasksListQueryOptions } from "@/lib/tasks/queries"
import { parseTasksSearch } from "@/lib/tasks/search"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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

export default function Page() {
  const [searchInput, setSearchInput] = useState("")
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
            placeholder="Search tasks… try is:issue status:closed priority:high"
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
        <Button className="h-10">Add task</Button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Search with GitHub-style qualifiers like status:closed and
            priority:high.
            {isDebouncing ? " Waiting for you to stop typing..." : ""}
            {!isDebouncing && isFetching ? " Refreshing results..." : ""}
          </p>
        </div>
        <Badge variant="secondary">
          {tasks.length} visible{allTasks.length !== tasks.length
            ? ` of ${allTasks.length}`
            : ""}
        </Badge>
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
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No matching tasks</EmptyTitle>
            <EmptyDescription>
              Try a different search, or clear a qualifier like status:closed.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id}>
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
                <Badge>{task.priority}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
