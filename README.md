# School Management v4 — Android + Web

An Expo / React Native local-first starter for maintaining student names, planning exams, building a weekly timetable, and backing up/restoring records.

## Run

```sh
npm install
npm run check
npx expo start --clear
```

Use `w` in Expo CLI for web or scan the QR code with Expo Go for Android. Android SQLite and browser local storage are separate stores and do not sync automatically.

## Features

- Overview and student directory: add and remove student records.
- Exam planner: create, sort, and remove dated exams by class; validates real calendar dates in `YYYY-MM-DD` format.
- Timetable: create weekly class periods with day and 24-hour times; validates the end is after the start.
- Backup/restore: export a JSON snapshot via the platform share sheet, copy/paste the JSON, and validate a snapshot before restoring.
- Persistence: Expo SQLite on Android; browser local storage on web.
- Input validation and a dependency-free smoke-check script.

## Storage, privacy, and limitations

Backups may contain sensitive student information. Keep them in a private, access-controlled location. This build has no authentication, role-based access, encryption, remote sync, or server-side backup. Anyone with access to the app/browser profile may view or change local records. Uninstalling the app or clearing browser data may remove local records; export backups regularly.

This is a focused rebuild for exams, timetable, and backup, not feature parity with all features described in the legacy README. The previously checked-in app imported multiple `src/*` modules that were absent from the repository root tree, so legacy auth, attendance, staff, CSV/PDF import/export, and LAN-sync behavior could not be reliably restored from the available source.

## Verification

`npm run check` runs static assertions for the entry point/config, absence of stale missing-module imports, and presence of exams, timetable, backup/restore, and input validation. Static checks do not replace dependency installation, Expo bundling, or hands-on Android/browser acceptance tests. In a network-enabled environment, also run `npx expo export --platform android` and `npx expo export --platform web` before deployment.
