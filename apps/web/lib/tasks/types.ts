import z from "zod"

export const TaskIdSchema = z.string().min(1)

export const TaskSchema = z.object({
  id: TaskIdSchema,
  title: z.string().min(1, "cannot be empty"),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["completed", "pending"]),
  dueDate: z.string(),
})

export const CreateTaskInputSchema = TaskSchema.omit({ id: true })
export const UpdateTaskInputSchema = CreateTaskInputSchema.partial()

export const TasksQuerySchema = z.object({
  status: z.enum(["completed", "pending"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  search: z.string().min(1).optional(),
})

export type TaskId = z.infer<typeof TaskIdSchema>
export type Task = z.infer<typeof TaskSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>
export type TasksQuery = z.infer<typeof TasksQuerySchema>

export type Priority = Task["priority"]
export type Status = Task["status"]

export interface TasksStorage {
  list(query?: TasksQuery): Promise<Task[]>
  get(id: TaskId): Promise<Task | null>
  create(input: CreateTaskInput): Promise<Task>
  update(id: TaskId, input: UpdateTaskInput): Promise<Task>
  remove(id: TaskId): Promise<void>
  seedTasks(): Promise<Task[]>
}
