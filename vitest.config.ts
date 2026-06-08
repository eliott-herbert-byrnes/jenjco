import path from "node:path"
import { defineConfig } from "vitest/config"

const root = path.resolve(import.meta.dirname)

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@/mastra",
        replacement: path.join(root, "src/mastra/index.ts"),
      },
      {
        find: "@",
        replacement: root,
      },
    ],
  },
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    passWithNoTests: true,
  },
})
