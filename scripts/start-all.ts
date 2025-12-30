import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const ROOT_DIR = path.join(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'web');

interface ProcessInfo {
  name: string;
  process: ChildProcess;
  color: string;
}

const processes: ProcessInfo[] = [];

function log(prefix: string, color: string, message: string) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}[${prefix}]${colors.reset} ${message}`);
}

function checkMongoDB(): boolean {
  const platform = os.platform();
  try {
    if (platform === 'darwin' || platform === 'linux') {
      execSync('pgrep -x mongod', { stdio: 'pipe' });
    } else {
      execSync('tasklist | findstr mongod', { stdio: 'pipe', shell: 'cmd.exe' });
    }
    return true;
  } catch {
    return false;
  }
}

function startMongoDB(): boolean {
  const platform = os.platform();
  log('MongoDB', colors.yellow, 'Attempting to start MongoDB...');

  try {
    if (platform === 'darwin') {
      execSync('brew services start mongodb-community', { stdio: 'pipe' });
      log('MongoDB', colors.green, 'Started via Homebrew');
      return true;
    } else if (platform === 'linux') {
      execSync('sudo systemctl start mongod', { stdio: 'pipe' });
      log('MongoDB', colors.green, 'Started via systemctl');
      return true;
    }
  } catch (e) {
    log('MongoDB', colors.red, 'Could not auto-start MongoDB. Please start it manually.');
  }
  return false;
}

function spawnProcess(name: string, command: string, args: string[], cwd: string, color: string): ChildProcess {
  const proc = spawn(command, args, {
    cwd,
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: true,
  });

  proc.stdout?.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) {
        log(name, color, line);
      }
    });
  });

  proc.stderr?.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) {
        log(name, colors.red, line);
      }
    });
  });

  proc.on('close', (code) => {
    log(name, code === 0 ? colors.green : colors.red, `Process exited with code ${code}`);
    // Remove from processes array
    const idx = processes.findIndex((p) => p.process === proc);
    if (idx !== -1) {
      processes.splice(idx, 1);
    }
  });

  return proc;
}

async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════╗
║       Polymarket Copy Trading Bot - Launcher          ║
╚══════════════════════════════════════════════════════╝${colors.reset}
`);

  // Check MongoDB
  log('System', colors.blue, 'Checking MongoDB...');
  if (!checkMongoDB()) {
    log('MongoDB', colors.yellow, 'MongoDB is not running');
    if (!startMongoDB()) {
      log('MongoDB', colors.red, 'Please start MongoDB manually and try again');
      console.log(`
${colors.yellow}To start MongoDB:${colors.reset}
  macOS:   brew services start mongodb-community
  Linux:   sudo systemctl start mongod
  Windows: net start MongoDB
`);
      process.exit(1);
    }
    // Wait a bit for MongoDB to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } else {
    log('MongoDB', colors.green, 'MongoDB is running');
  }

  // Check if web dependencies are installed
  const webNodeModules = path.join(WEB_DIR, 'node_modules');
  if (fs.existsSync(WEB_DIR) && !fs.existsSync(webNodeModules)) {
    log('Web', colors.yellow, 'Installing web dependencies...');
    execSync('npm install', { cwd: WEB_DIR, stdio: 'inherit' });
  }

  // Start Bot
  log('Bot', colors.magenta, 'Starting copy trading bot...');
  const botProc = spawnProcess('Bot', 'npm', ['run', 'dev'], ROOT_DIR, colors.magenta);
  processes.push({ name: 'Bot', process: botProc, color: colors.magenta });

  // Wait a bit before starting web
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Start Web Dashboard
  if (fs.existsSync(WEB_DIR)) {
    log('Web', colors.cyan, 'Starting web dashboard on http://localhost:3001 ...');
    const webProc = spawnProcess('Web', 'npm', ['run', 'dev'], WEB_DIR, colors.cyan);
    processes.push({ name: 'Web', process: webProc, color: colors.cyan });
  }

  console.log(`
${colors.green}${colors.bright}All services started!${colors.reset}

${colors.cyan}Dashboard:${colors.reset}  http://localhost:3001
${colors.cyan}Bot logs:${colors.reset}   See [Bot] messages above

${colors.dim}Press Ctrl+C to stop all services${colors.reset}
${'─'.repeat(50)}
`);

  // Handle shutdown
  const shutdown = () => {
    console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);

    for (const proc of processes) {
      log(proc.name, proc.color, 'Stopping...');
      proc.process.kill('SIGTERM');
    }

    setTimeout(() => {
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(console.error);
