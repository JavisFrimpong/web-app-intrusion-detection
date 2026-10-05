import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../');
const backendDir = path.resolve(projectRoot, 'app/backend');
const frontendDir = path.resolve(projectRoot, 'app/frontend');

console.log('====================================================');
console.log('🚀 LAUNCHING AEGIS ENTERPRISE SOC PLATFORM');
console.log('====================================================');

const env = { ...process.env };

console.log('[1/2] Starting Flask Backend API (python app.py)...');
const backendProcess = spawn('python', ['app.py'], {
  cwd: backendDir,
  env,
  shell: true,
  stdio: 'inherit',
});

console.log('[2/2] Starting Vite Frontend Console (npm run dev)...');
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  env,
  shell: true,
  stdio: 'inherit',
});

setTimeout(() => {
  const url = 'http://localhost:5173';
  console.log(`\n🌐 AEGIS SOC Console: ${url}\n`);

  const command =
    process.platform === 'win32' ? 'start' :
    process.platform === 'darwin' ? 'open' : 'xdg-open';

  spawn(command, process.platform === 'win32' ? ['', url] : [url], {
    shell: true,
    stdio: 'ignore',
  });
}, 3000);

process.on('SIGINT', () => {
  backendProcess.kill();
  frontendProcess.kill();
  process.exit();
});
