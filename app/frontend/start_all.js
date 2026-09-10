const { spawn } = require('child_process');
const path = require('path');
const open = require('open');

const projectRoot = path.resolve(__dirname, '../../');
const backendDir = path.resolve(projectRoot, 'app/backend');
const frontendDir = path.resolve(projectRoot, 'app/frontend');

console.log('====================================================');
echo('🚀 LAUNCHING AEGIS ENTERPRISE SOC PLATFORM');
console.log('====================================================');

const env = {
  ...process.env,
  SMTP_USER: 'spencer.mail.services@gmail.com',
  SMTP_PASS: 'sbee ejrh cdos vfgx',
};

function echo(msg) { console.log(msg); }

// Spawn Backend
console.log('[1/2] Starting Flask Backend API (python app.py)...');
const backendProcess = spawn('python', ['app.py'], {
  cwd: backendDir,
  env,
  shell: true,
  stdio: 'inherit',
});

// Spawn Frontend
console.log('[2/2] Starting Vite Frontend Console (npm run dev)...');
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  env,
  shell: true,
  stdio: 'inherit',
});

// Open Browser after 3 seconds
setTimeout(() => {
  console.log('\n🌐 Opening AEGIS SOC Console at http://localhost:5173...\n');
  import('open').then(m => m.default('http://localhost:5173')).catch(() => {});
}, 3000);

process.on('SIGINT', () => {
  backendProcess.kill();
  frontendProcess.kill();
  process.exit();
});
