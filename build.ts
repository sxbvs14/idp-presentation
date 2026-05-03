import { $ } from 'bun';

// Build script: copy public/ to dist/ and verify
await $`rm -rf dist`;
await $`mkdir -p dist`;
await $`cp -r public/* dist/`;

// Verify critical files exist
const critical = ['index.html', 'css/styles.css', 'js/main.js'];
let ok = true;
for (const f of critical) {
  const file = Bun.file(`dist/${f}`);
  if (!(await file.exists())) {
    console.error(`Missing: ${f}`);
    ok = false;
  }
}

if (ok) {
  console.log('Build OK. Output in dist/');
} else {
  process.exit(1);
}
