import { HelloWorld } from "@/components/hello-world"
import { expect, test } from "vitest"
import { render } from "vitest-browser-react"

test("renders name", async () => {
  const { getByText, getByRole } = await render(<HelloWorld name="Vitest" />)

  await expect.element(getByText("Hello Vitest x1!")).toBeInTheDocument()
  await getByRole("button", { name: "Increment " }).click()

  await expect.element(getByText("Hello Vitest x2!")).toBeInTheDocument()
})
