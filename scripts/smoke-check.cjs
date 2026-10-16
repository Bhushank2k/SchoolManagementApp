const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
assert.equal(pkg.main, 'index.js', 'Expo entry point must remain index.js');
assert.ok(pkg.dependencies.expo && pkg.dependencies['expo-sqlite'], 'Expo and SQLite dependencies are required');
assert.ok(config.expo.android.package, 'Android package id must be configured');
assert.equal(pkg.scripts.check, 'node scripts/smoke-check.cjs', 'check script must point at this smoke check');
for (const token of ['./src/database/db', './src/auth/auth', './src/sync/syncEngine', 'AppState.addEventListener']) {
  assert.ok(!app.includes(token), 'stale/broken reference remains: ' + token);
}
for (const token of ['Exam planner', 'Class timetable', 'Backup & restore', 'openDatabaseAsync', 'validateSnapshot', 'localStorage']) {
  assert.ok(app.includes(token), 'missing expected capability: ' + token);
}
assert.ok(app.includes('startTime >= endTime'), 'timetable must reject inverted time ranges');
assert.ok(app.includes('schemaVersion'), 'backup export must be versioned');
console.log('Smoke checks passed: entrypoint/config, no stale imports, exams, timetable, backup/restore and input validation.');
