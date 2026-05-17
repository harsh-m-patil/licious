import { queryOptions } from "@tanstack/react-query"

import { createLocalStorageTasksStorage } from "./adapters/localStorage"
import type { TasksQuery } from "./types"

const tasksStorage = createLocalStorageTasksStorage()

export const tasksKeys = {
  all: ["tasks"] as const,
  list: (query?: TasksQuery) => [...tasksKeys.all, "list", query ?? {}] as const,
}

export const tasksListQueryOptions = (query?: TasksQuery) =>
  queryOptions({
    queryKey: tasksKeys.list(query),
    queryFn: () => tasksStorage.list(query),
  })
