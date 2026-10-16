# Audit notes for SchoolManagement v3 (app version 2.0.0)

## Dependency upgrade (Expo SDK 54 -> 57)
- expo ~57.0.28, react 19.2.3, react-native 0.86.3 (the versions SDK 57 requires; npm "latest" react-native 0.87.1 and react 19.3 are NOT compatible with Expo 57 and break Metro bundling).
- expo-sqlite/file-system/print/sharing/status-bar pinned to SDK 57 versions; @react-navigation/native 7.5, bottom-tabs 7.21, react-native-screens ~4.26, safe-area-context ~5.7, papaparse 5.7.
- Removed unused expo-document-picker (dependency and config plugin).
- Server: express 5.3, better-sqlite3 13, cors 2.8.6.

## Errors fixed
- Entry point: added index.js with registerRootComponent (replaces `expo/AppEntry`).
- CSV export: moved from deprecated `expo-file-system/legacy` to the current `File`/`Paths` API; formulas in cells are escaped to prevent spreadsheet formula injection.
- Roll numbers were globally UNIQUE, so roll 1 could exist in only one class. Now unique per class + section + roll. Existing v1 databases are migrated automatically (PRAGMA user_version).
- Foreign keys are now enforced; deleting a student cascades attendance and runs in a transaction.
- Attendance: date is validated (YYYY-MM-DD, real calendar date); saving is a single transaction (all-or-nothing).
- Students/Staff screens: add-forms moved into the list header so the whole screen scrolls (previously the list was squeezed off-screen on small phones/with keyboard open); keyboard taps no longer dismissed.
- Numeric sorting of classes and roll numbers (2 before 10).
- Delete/save handlers now report errors instead of failing silently.
- App.js shows a clear error message (no endless spinner) if the database cannot open.
- Server: optional API key, central JSON/error handler, prepared statements reused.

## Verified here
- `npm install` succeeds; `expo export --platform android` bundles successfully (892 modules).
- Server smoke-tested: health, API key rejection, sync insert, bad-JSON handling, event listing.
- v1 -> v2 database migration SQL tested on sample data.

## Not verified / limitations
- Not run on a physical device or emulator (none available here); `expo install --fix` / `expo-doctor` could not reach Expo's API from this environment.
- Still no login/roles, CSV import, photos, or working automatic sync; server is not wired to the app and should not be exposed to the internet.
