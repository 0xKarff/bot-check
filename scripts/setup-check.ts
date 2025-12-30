import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { exec, execSync, spawn } from 'child_process';
import * as os from 'os';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

const ROOT_DIR = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');
const ENV_EXAMPLE = path.join(ROOT_DIR, '.env.example');

interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  fix?: () => Promise<void>;
}

// Check Node.js version
async function checkNode(): Promise<CheckResult> {
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    if (major >= 18) {
      return { name: 'Node.js', status: 'ok', message: `Version ${version}` };
    }
    return {
      name: 'Node.js',
      status: 'error',
      message: `Version ${version} (requires 18+)`,
    };
  } catch {
    return { name: 'Node.js', status: 'error', message: 'Not found' };
  }
}

// Check MongoDB
async function checkMongoDB(): Promise<CheckResult> {
  const platform = os.platform();

  // Check if MongoDB is running
  try {
    if (platform === 'darwin') {
      execSync('pgrep -x mongod', { stdio: 'pipe' });
    } else if (platform === 'linux') {
      execSync('pgrep mongod', { stdio: 'pipe' });
    } else {
      execSync('tasklist | findstr mongod', { stdio: 'pipe', shell: 'cmd.exe' });
    }
    return { name: 'MongoDB', status: 'ok', message: 'Running' };
  } catch {
    // MongoDB not running, check if installed
    try {
      if (platform === 'darwin') {
        execSync('which mongod', { stdio: 'pipe' });
      } else if (platform === 'linux') {
        execSync('which mongod', { stdio: 'pipe' });
      } else {
        execSync('where mongod', { stdio: 'pipe', shell: 'cmd.exe' });
      }
      return {
        name: 'MongoDB',
        status: 'warning',
        message: 'Installed but not running',
        fix: async () => {
          log.info('Starting MongoDB...');
          if (platform === 'darwin') {
            try {
              execSync('brew services start mongodb-community', { stdio: 'inherit' });
            } catch {
              log.warn('Could not start via Homebrew. Try: mongod --dbpath /usr/local/var/mongodb');
            }
          } else if (platform === 'linux') {
            try {
              execSync('sudo systemctl start mongod', { stdio: 'inherit' });
            } catch {
              log.warn('Could not start MongoDB. Try: sudo mongod --dbpath /var/lib/mongodb');
            }
          }
        },
      };
    } catch {
      return {
        name: 'MongoDB',
        status: 'error',
        message: 'Not installed',
        fix: async () => {
          log.title('MongoDB Installation Guide');
          if (platform === 'darwin') {
            console.log(`
${colors.cyan}For macOS (using Homebrew):${colors.reset}
  1. Install Homebrew (if not installed):
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  2. Add MongoDB tap:
     brew tap mongodb/brew

  3. Install MongoDB:
     brew install mongodb-community

  4. Start MongoDB:
     brew services start mongodb-community
`);
          } else if (platform === 'linux') {
            console.log(`
${colors.cyan}For Ubuntu/Debian:${colors.reset}
  1. Import MongoDB GPG key:
     curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

  2. Add repository:
     echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

  3. Install MongoDB:
     sudo apt-get update && sudo apt-get install -y mongodb-org

  4. Start MongoDB:
     sudo systemctl start mongod
`);
          } else {
            console.log(`
${colors.cyan}For Windows:${colors.reset}
  1. Download MongoDB Community Server from:
     https://www.mongodb.com/try/download/community

  2. Run the installer and follow the prompts
  3. MongoDB should start automatically as a service
`);
          }

          const answer = await question('\nPress Enter after installing MongoDB to continue...');
        },
      };
    }
  }
}

// Check .env file
async function checkEnvFile(): Promise<CheckResult> {
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    const requiredVars = [
      'USER_ADDRESSES',
      'PROXY_WALLET',
      'PRIVATE_KEY',
      'MONGO_URI',
      'RPC_URL',
    ];

    const missing: string[] = [];
    const empty: string[] = [];

    for (const v of requiredVars) {
      const match = content.match(new RegExp(`^${v}\\s*=\\s*['"]?(.*)['"]?`, 'm'));
      if (!match) {
        missing.push(v);
      } else if (!match[1] || match[1].includes('your_') || match[1] === "''") {
        empty.push(v);
      }
    }

    if (missing.length > 0 || empty.length > 0) {
      return {
        name: '.env File',
        status: 'warning',
        message: `Missing/empty: ${[...missing, ...empty].join(', ')}`,
        fix: () => configureEnv(),
      };
    }

    return { name: '.env File', status: 'ok', message: 'Configured' };
  }

  return {
    name: '.env File',
    status: 'error',
    message: 'Not found',
    fix: () => configureEnv(),
  };
}

// Interactive .env configuration
async function configureEnv(): Promise<void> {
  log.title('Environment Configuration');

  // Start with example file if .env doesn't exist
  if (!fs.existsSync(ENV_FILE) && fs.existsSync(ENV_EXAMPLE)) {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
  }

  let envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : '';

  const updateEnv = (key: string, value: string) => {
    const regex = new RegExp(`^${key}\\s*=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key} = '${value}'`);
    } else {
      envContent += `\n${key} = '${value}'`;
    }
  };

  // Trader address
  console.log(`\n${colors.cyan}1. Trader Address${colors.reset}`);
  console.log('   Enter the Polymarket wallet address(es) you want to copy.');
  console.log('   Find traders at: https://polymarket.com/leaderboard');
  const traderAddress = await question('   Trader address (0x...): ');
  if (traderAddress.trim()) {
    updateEnv('USER_ADDRESSES', traderAddress.trim());
  }

  // Proxy wallet
  console.log(`\n${colors.cyan}2. Your Wallet Address${colors.reset}`);
  console.log('   Your Polygon wallet address (the one you use on Polymarket)');
  const proxyWallet = await question('   Your wallet address (0x...): ');
  if (proxyWallet.trim()) {
    updateEnv('PROXY_WALLET', proxyWallet.trim());
  }

  // Private key
  console.log(`\n${colors.cyan}3. Private Key${colors.reset}`);
  console.log('   Your wallet private key (WITHOUT 0x prefix)');
  console.log(`   ${colors.yellow}⚠ Never share this with anyone!${colors.reset}`);
  const privateKey = await question('   Private key: ');
  if (privateKey.trim()) {
    const key = privateKey.trim().startsWith('0x') ? privateKey.trim().slice(2) : privateKey.trim();
    updateEnv('PRIVATE_KEY', key);
  }

  // MongoDB URI
  console.log(`\n${colors.cyan}4. MongoDB URI${colors.reset}`);
  console.log('   Local: mongodb://localhost:27017/polymarket');
  console.log('   Cloud: mongodb+srv://user:pass@cluster.mongodb.net/db');
  const mongoUri = await question('   MongoDB URI [mongodb://localhost:27017/polymarket]: ');
  updateEnv('MONGO_URI', mongoUri.trim() || 'mongodb://localhost:27017/polymarket');

  // RPC URL
  console.log(`\n${colors.cyan}5. Polygon RPC URL${colors.reset}`);
  console.log('   Get free RPC from: https://www.alchemy.com or https://infura.io');
  const rpcUrl = await question('   RPC URL: ');
  if (rpcUrl.trim()) {
    updateEnv('RPC_URL', rpcUrl.trim());
  }

  // Copy settings
  console.log(`\n${colors.cyan}6. Copy Strategy${colors.reset}`);
  console.log('   PERCENTAGE - Copy X% of trader order size');
  console.log('   FIXED - Copy fixed dollar amount');
  const strategy = await question('   Strategy [PERCENTAGE]: ');
  updateEnv('COPY_STRATEGY', (strategy.trim().toUpperCase() || 'PERCENTAGE'));

  const copySize = await question('   Copy size (e.g., 10 for 10% or $10) [10]: ');
  updateEnv('COPY_SIZE', copySize.trim() || '10.0');

  const maxOrder = await question('   Max order size in USD [100]: ');
  updateEnv('MAX_ORDER_SIZE_USD', maxOrder.trim() || '100.0');

  // Save
  fs.writeFileSync(ENV_FILE, envContent);
  log.success('.env file saved!');
}

// Check npm dependencies
async function checkDependencies(): Promise<CheckResult> {
  const nodeModules = path.join(ROOT_DIR, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    return { name: 'Dependencies', status: 'ok', message: 'Installed' };
  }
  return {
    name: 'Dependencies',
    status: 'error',
    message: 'Not installed',
    fix: async () => {
      log.info('Installing dependencies...');
      execSync('npm install', { cwd: ROOT_DIR, stdio: 'inherit' });
    },
  };
}

// Check web dependencies
async function checkWebDependencies(): Promise<CheckResult> {
  const webNodeModules = path.join(ROOT_DIR, 'web', 'node_modules');
  const webDir = path.join(ROOT_DIR, 'web');

  if (!fs.existsSync(webDir)) {
    return { name: 'Web Dashboard', status: 'warning', message: 'Not found' };
  }

  if (fs.existsSync(webNodeModules)) {
    return { name: 'Web Dashboard', status: 'ok', message: 'Installed' };
  }
  return {
    name: 'Web Dashboard',
    status: 'error',
    message: 'Dependencies not installed',
    fix: async () => {
      log.info('Installing web dependencies...');
      execSync('npm install', { cwd: webDir, stdio: 'inherit' });
    },
  };
}

// Main function
async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════╗
║     Polymarket Copy Trading Bot - Setup Check         ║
╚══════════════════════════════════════════════════════╝${colors.reset}
`);

  const checks: CheckResult[] = [];

  // Run all checks
  log.title('Running Checks...');

  checks.push(await checkNode());
  checks.push(await checkMongoDB());
  checks.push(await checkEnvFile());
  checks.push(await checkDependencies());
  checks.push(await checkWebDependencies());

  // Display results
  log.title('Check Results');
  console.log('─'.repeat(50));

  for (const check of checks) {
    const icon = check.status === 'ok' ? colors.green + '✓' : check.status === 'warning' ? colors.yellow + '⚠' : colors.red + '✗';
    console.log(`${icon}${colors.reset} ${check.name.padEnd(20)} ${check.message}`);
  }

  console.log('─'.repeat(50));

  // Handle fixes
  const issues = checks.filter((c) => c.status !== 'ok' && c.fix);

  if (issues.length > 0) {
    console.log(`\n${colors.yellow}Found ${issues.length} issue(s) that need attention.${colors.reset}`);

    for (const issue of issues) {
      const answer = await question(`\nFix "${issue.name}"? (y/n): `);
      if (answer.toLowerCase() === 'y' && issue.fix) {
        await issue.fix();
      }
    }

    // Re-run checks
    console.log('\n');
    log.info('Re-running checks...');
    const recheck = await Promise.all([
      checkNode(),
      checkMongoDB(),
      checkEnvFile(),
      checkDependencies(),
      checkWebDependencies(),
    ]);

    const allOk = recheck.every((c) => c.status === 'ok');
    if (allOk) {
      log.success('All checks passed!');
    } else {
      log.warn('Some issues remain. Please fix them manually.');
    }
  } else {
    log.success('All checks passed! You are ready to go.');
  }

  console.log(`
${colors.cyan}Next Steps:${colors.reset}
  1. Start the bot:      npm run start:all
  2. Or run separately:
     - Bot only:         npm run dev
     - Dashboard only:   npm run web
  3. Open dashboard:     http://localhost:3001
`);

  rl.close();
}

main().catch(console.error);
