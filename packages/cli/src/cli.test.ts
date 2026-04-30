import { describe, it, expect, beforeEach, afterEach } from "vitest"
import * as fs from "fs"
import * as path from "path"
import { execSync } from "child_process"

const CLI_PATH = path.resolve(__dirname, "../dist/cli.js")
const TEST_SKILLS_DIR = path.join(__dirname, "../test-skills")

describe("why-run CLI", () => {
  beforeEach(() => {
    // Create test skills directory
    if (!fs.existsSync(TEST_SKILLS_DIR)) {
      fs.mkdirSync(TEST_SKILLS_DIR, { recursive: true })
    }
  })

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(TEST_SKILLS_DIR)) {
      fs.rmSync(TEST_SKILLS_DIR, { recursive: true })
    }
  })

  it("should show help", () => {
    const output = execSync(`node ${CLI_PATH} help`, { encoding: "utf-8" })
    expect(output).toContain("why-run")
    expect(output).toContain("install-skill")
  })

  it("should show help for unknown commands", () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: "utf-8" })
    expect(output).toContain("Commands:")
  })

  it("should have skill files bundled", () => {
    const skillDir = path.resolve(__dirname, "../skill")
    expect(fs.existsSync(skillDir)).toBe(true)
    expect(fs.existsSync(path.join(skillDir, "SKILL.md"))).toBe(true)
  })
})
