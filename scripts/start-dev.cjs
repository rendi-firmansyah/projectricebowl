const path = require('path')
const { spawn } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const backendDir = path.join(rootDir, 'backend')
const isWindows = process.platform === 'win32'

const children = []

function start(name, command, cwd = rootDir) {
  const child = spawn(command, {
    cwd,
    stdio: 'inherit',
    shell: isWindows
  })

  children.push(child)

  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    const reason = signal || code
    console.log(`\n${name} berhenti (${reason}). Menghentikan proses lain...`)
    shutdown(code || 1)
  })

  return child
}

let shuttingDown = false

function shutdown(code = 0) {
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

start('Backend', 'node server.js', backendDir)
start('Frontend', 'npm run dev:frontend')
