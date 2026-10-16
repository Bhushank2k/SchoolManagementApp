# Source audit — SchoolManagementApp

## Findings from the original main branch

- `App.js` imported `./src/database/db`, `./src/auth/auth`, `./src/sync/syncEngine`, and `./src/components/*`, but the inspected repository root tree did not contain the required `src/` modules. Those imports could not resolve from the checked-in tree.
- `App.js` called `AppState.addEventListener(...)` without importing `AppState` from `react-native`.
- `package.json` declared a smoke-check script and server script, but the inspected root tree did not contain `scripts/smoke-check.cjs` or `server/`.
- Documentation described authentication, attendance, staff, CSV/PDF, and LAN sync, but implementation modules required for these screens were missing from the inspected tree.

## Focused rebuild

- Replaced the broken import graph with a self-contained Expo / React Native app.
- Added student directory, exam scheduling, weekly timetable, and JSON backup/restore.
- Uses Expo SQLite on Android and browser local storage on web. These stores are independent and do not sync.
- Added static smoke checks and refreshed app configuration/documentation.

## Verification and limitations

Static smoke checks are intended to run with `npm run check`. A full dependency install, Android bundle, web bundle, and device/browser acceptance test still need to be run in a network-enabled build environment.

This is not feature parity with the missing legacy auth, attendance, staff, CSV/PDF, photo, or LAN-sync modules. Authentication, role permissions, encrypted storage, and remote backups are not implemented. Do not deploy with real student data until these requirements and builds are reviewed.
