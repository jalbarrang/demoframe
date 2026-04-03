import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(here, '../package.json')
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const tag = `v${pkg.version}`
const args = new Set(process.argv.slice(2))

if (args.has('--help') || args.has('-h')) {
  console.log('Usage: pnpm release:tag [--dry-run]')
  console.log('Creates and pushes a v<package.json version> tag to origin.')
  process.exit(0)
}

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options
  })
}

const dirty = run('git status --porcelain').trim()
if (dirty) {
  console.error('Working tree is not clean. Commit or stash changes before tagging a release.')
  process.exit(1)
}

if (args.has('--dry-run')) {
  console.log(tag)
  process.exit(0)
}

try {
  run(`git rev-parse --verify ${tag}`)
  console.error(`Tag ${tag} already exists locally.`)
  process.exit(1)
} catch {
  // tag does not exist locally
}

const remoteTag = run(`git ls-remote --tags origin refs/tags/${tag}`).trim()
if (remoteTag) {
  console.error(`Tag ${tag} already exists on origin.`)
  process.exit(1)
}

execSync(`git tag ${tag}`, { stdio: 'inherit' })
execSync(`git push origin ${tag}`, { stdio: 'inherit' })

console.log(`Released ${tag}`)
