# adOptions.js – Add dropdown options to Firestore

Adds selectable options (e.g., Division, Designation) into a collection’s `allOptions` document using a service account. Supports single-item adds or bulk CSV.

## Requirements
- Node.js
- Service account JSON at `../serviceAccountKey.json` (relative to `scrpt/`)
- Firestore write access to the target collections
- For CSV: header row with `collection,name`

## Usage
From `scrpt/`:

### Single option
```bash
node adOptions.js --collection="divisions" --name="IT Division"
```
- Writes to `{collection}/allOptions` and array-unions the `name` into the `options` field (creates doc if missing).

### Bulk import from CSV
```bash
node adOptions.js --file="./options.csv"
```
- CSV headers: `collection,name`
- Each row is merged into `{collection}/allOptions` with arrayUnion.
- Invalid rows (missing `collection` or `name`) are skipped.

## Behavior details
- Uses `arrayUnion` so duplicates in Firestore are ignored.
- Creates/merges `allOptions` document per collection; does not delete anything.
- Exits with code 1 if CSV file is missing or if required args are absent.

## Examples
- Add a designation option:
  ```bash
  node adOptions.js --collection="designations" --name="Supervisor"
  ```
- Import multiple collections/options:
  ```bash
  # options.csv
  # collection,name
  divisions,Admin and Finance
  divisions,Operations
  designations,Manager
  designations,Staff

  node adOptions.js --file="./options.csv"
  ```

## Common issues
- Missing CSV or bad path: ensure the file exists and has `collection,name` headers.
- No args provided: use either `--file` or both `--collection` and `--name`.
- Firestore permission errors: confirm the service account can write to the target collection.
