# adloc.js – Office location import/upsert

Adds or updates documents in the Firestore `locations` collection using a service account. Supports single entry via CLI flags or bulk CSV.

## Requirements
- Node.js
- Service account JSON at `../serviceAccountKey.json` (relative to `scrpt/`)
- Firestore access with write permissions to `locations`
- CSV: plain text, UTF-8, `name,latitude,longitude` per line (no header required)

## Usage
From `scrpt/`:

### Single location
```bash
node adloc.js --name="QPO" --latitude=14.7263366 --longitude=121.6354393 [--overwrite]
```
- Without `--overwrite`, an existing location with the same `name` is left untouched.
- With `--overwrite`, the first matching doc by `name` is updated with new coords (merge).

### Bulk from CSV
```bash
node adloc.js --csv="locations.csv" [--overwrite]
```
- Expects each non-empty line: `name,latitude,longitude`
- Processes each line and applies the same overwrite behavior as above.

## Behavior details
- Duplicate handling: searches by `name`. If found and `--overwrite` is not set, the entry is skipped. If `--overwrite` is set, the first matching doc is updated (merge).
- New docs: created with `name`, `latitude`, `longitude`. Doc ID is auto-generated.
- Numeric parsing: `latitude`/`longitude` are parsed with `parseFloat`.

## Examples
- Add or skip if exists:
  ```bash
  node adloc.js --name="HQ" --latitude=14.6 --longitude=120.98
  ```
- Force update coordinates:
  ```bash
  node adloc.js --name="HQ" --latitude=14.7 --longitude=120.99 --overwrite
  ```
- Import CSV:
  ```bash
  node adloc.js --csv="./offices.csv"
  ```

## Common issues
- “already exists” message: add `--overwrite` to update.
- CSV path incorrect: ensure the file exists and is readable.
- Firestore permission errors: confirm the service account has write access to `locations`.
