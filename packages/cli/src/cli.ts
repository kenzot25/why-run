#!/usr/bin/env node
import * as fs from "fs"
import * as path from "path"

const SKILLS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".claude",
  "skills"
)
const SKILL_NAME = "why-run-debugger"

function showHelp(): void {
  console.log(`
why-run - Trace function calls to understand why they ran

Usage:
  why-run <command> [options]

Commands:
  install-skill    Install the why-run-debugger Claude Code skill
  help             Show this help message

Examples:
  why-run install-skill
`)
}

function installSkill(): void {
  console.log("🔧 Installing why-run-debugger Claude Code skill...\n")

  // Find skill files in the npm package
  const packageDir = path.resolve(__dirname, "..")
  const skillSourceDir = path.join(packageDir, "skill")

  if (!fs.existsSync(skillSourceDir)) {
    console.error("❌ Error: Skill files not found in package")
    console.error(`   Looked in: ${skillSourceDir}`)
    process.exit(1)
  }

  // Create skills directory if needed
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true })
  }

  const targetDir = path.join(SKILLS_DIR, SKILL_NAME)

  // Check if already exists
  if (fs.existsSync(targetDir)) {
    console.log(`⚠️  Skill already exists at ${targetDir}`)
    // In a real CLI, we'd ask for confirmation. For now, just update.
    console.log("📝 Updating existing skill...\n")
    fs.rmSync(targetDir, { recursive: true })
  }

  // Copy skill files
  copyDir(skillSourceDir, targetDir)

  console.log("✅ Skill installed successfully!\n")
  console.log(`📍 Location: ${targetDir}\n`)
  console.log("📝 Usage:")
  console.log("   Open Claude Code and ask questions like:")
  console.log('   - "why did fetchUser run?"')
  console.log('   - "analyze my traces"')
  console.log('   - "what is slow in my code?"')
  console.log('   - "debug this call chain"')
  console.log("")
  console.log("💡 Make sure you have why-run integrated in your project:")
  console.log("   npm install why-run")
  console.log("")
  console.log("🔄 Reload Claude Code to pick up the new skill")
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// Main CLI
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case "install-skill":
    installSkill()
    break
  case "help":
  case "--help":
  case "-h":
  default:
    showHelp()
    if (
      command &&
      command !== "help" &&
      command !== "--help" &&
      command !== "-h"
    ) {
      console.error(`\n❌ Unknown command: ${command}`)
      process.exit(1)
    }
    break
}
