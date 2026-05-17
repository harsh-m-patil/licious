import z from "zod"

const TaskIdSchema = z.string().min(1)

const TaskSchema = z.object({
  id: TaskIdSchema,
  title: z.string().min(1, "cannot be empty"),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["completed", "pending"]),
  dueDate: z.string(),
})

const CreateTaskInputSchema = TaskSchema.omit({ id: true })
export const TaskFormSchema = CreateTaskInputSchema.omit({ status: true }).extend({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  dueDate: z.string().min(1, "Due date is required"),
})

export const normalizeTaskFormInput = ({
  description,
  ...task
}: z.infer<typeof TaskFormSchema>) => ({
  ...task,
  description: description && description.length > 0 ? description : null,
})

export const CreateTaskFormSchema = TaskFormSchema.transform((input) => ({
  ...normalizeTaskFormInput(input),
  status: "pending" as const,
}))
const UpdateTaskInputSchema = CreateTaskInputSchema.partial()

const TasksQuerySchema = z.object({
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
