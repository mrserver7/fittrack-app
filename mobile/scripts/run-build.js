const { spawn } = require('child_process');
const path = require('path');

const p8Path = path.resolve('C:/Users/mrser/Desktop/the main workout app/trainerhub/mobile/AuthKey_2L2WCHL8TJ.p8');

const env = {
  ...process.env,
  EXPO_TOKEN: 'jUr8ISf7ZEhfA_IymIoTBhASpCmjpsNzjbMLNuoV',
  FORCE_COLOR: '0',
};

const child = spawn('cmd', [
  '/c', 'C:\\Users\\mrser\\AppData\\Roaming\\npm\\eas.cmd',
  'build', '--profile', 'preview', '--platform', 'ios'
], {
  cwd: 'C:\\Users\\mrser\\Desktop\\the main workout app\\trainerhub\\mobile',
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: false,
});

let buffer = '';
const answers = [];
let answerIndex = 0;

// Answer map: keyed by prompt content
const answerMap = [
  { match: /automatically|setup credentials|set up credentials/i, answer: '\n' },         // Yes to auto setup
  { match: /Apple API Key|authentication method|authenticate/i, answer: '2\n' },           // Select Apple API Key (option 2)
  { match: /Key ID|key identifier/i, answer: '2L2WCHL8TJ\n' },
  { match: /Issuer ID|issuer/i, answer: 'dab1489e-2e7c-40e6-93c1-91ecb80e9565\n' },
  { match: /\.p8|path to.*key|key path|private key/i, answer: p8Path + '\n' },
  { match: /\(y\/n\)|\(Y\/n\)/i, answer: '\n' },                                           // Default yes for any yes/no
];

function tryAnswer(data) {
  const text = data.toString();
  process.stdout.write(text);
  buffer += text;

  for (const { match, answer } of answerMap) {
    if (match.test(buffer)) {
      buffer = '';
      setTimeout(() => {
        process.stdout.write(`[SENDING]: ${JSON.stringify(answer)}\n`);
        child.stdin.write(answer);
      }, 500);
      break;
    }
  }
}

child.stdout.on('data', tryAnswer);
child.stderr.on('data', tryAnswer);

child.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);
  process.exit(code);
});

// Safety timeout - 8 minutes
setTimeout(() => {
  console.log('\nTimeout reached');
  child.kill();
}, 8 * 60 * 1000);
