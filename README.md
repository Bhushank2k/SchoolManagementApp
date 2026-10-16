# School Management System v3 — Android + Web

Offline-first Expo application based on the supplied **School Management App – Complete Development Guide**. Android and web use the same responsive React Native screens; browser and device databases remain separate unless manually synced.

## Features
- First-run administrator setup; local sign-in, SHA-256 salted password hashes, password change, user enable/disable, admin/teacher role-gated navigation.
- Student directory with class/section/roll, parent contacts, address, date of birth, search, delete and optional photo selection.
- Offline attendance by class and date: Present / Absent / Late / Leave, transactional save and per-student-per-date uniqueness.
- Staff directory (administrator access), dashboard, CSV exports, PDF report and CSV paste-import for students/staff.
- Manual snapshot sync to a trusted LAN server with API-key option, remote snapshot retrieval and natural-key merge. Photos and user accounts are deliberately not synchronized.
- Settings and sync history; EAS APK configuration.

## Run Android or web
Use Node.js/npm in the root directory (where `App.js` and `package.json` exist):

```bash
npm install
npx expo start --clear
```

For browser dashboard:

```bash
npm run web
```

First launch creates the administrator account. Pick a unique username and a password of at least 8 characters. This account exists only in that browser/device database; it is not synced.

For Android APK, with a compatible EAS account:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## Import CSV
Open Import, choose Students or Staff, paste CSV text (copy from Excel/Sheets), and use the sample template to confirm headers. Students accept `name,rollNo,className,section,dob,parentPhone,address`; staff accept `name,designation,phone,email`. Missing required values and duplicate student natural keys are skipped. Make a backup before bulk imports.

## Optional LAN snapshot sync
On a trusted school computer:

```bash
cd server
npm install
# Optional, strongly recommended on shared networks:
# Linux/macOS: export API_KEY='replace-with-a-long-random-secret'
# PowerShell: $env:API_KEY='replace-with-a-long-random-secret'
npm start
```

From each device, enter `http://PC-IP:3000` under Settings → LAN sync and the same API key if configured, then press Sync now. The server stores one snapshot per device; the app merges remote students by class+section+roll, staff by name/email heuristic, and attendance by student natural key+date. Conflicting attendance values use last snapshot processed (not a robust timestamped conflict policy); verify reports after sync. This is a starter LAN sync, not a production cloud sync service. Never port-forward or expose the server publicly. Use HTTPS, authentication, rate limiting, backups and a formal conflict strategy before wider deployment.

## Important limitations
- Local account hashes are not a replacement for server-side authentication or encrypted storage. Anyone with database/file access may bypass local app controls.
- Photos are local URIs and are not backed up or synced. Removing/reinstalling the app or browser data may make them unavailable.
- Web browser SQLite persistence depends on Expo/browser support; browser storage is separate from Android and can be cleared by browser settings.
- The app does not provide fee management, timetable, exams/marks, parent portal, messaging, push notifications, or formal school ERP integrations; these were not specified in the supplied development guide.
- Physical Android, browser, offline, CSV, PDF and multi-device tests are still required before production use.

## Source files
- `docs/PRD-IMPLEMENTATION.md` — feature map and acceptance test checklist.
- `docs/source/School-Management-Development-Guide.pdf` — original user-supplied guide.
- `VALIDATION-STATUS.md` — checks actually performed for this package.
