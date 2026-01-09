# addAss2.js – Asset import script

CLI/CSV importer for Firestore `assets` collection using the service account.

## Requirements
- Node.js
- Service account JSON at `../serviceAccountKey.json` (relative to `scrpt/`)
- Firestore reachable with permissions to write `assets`
- CSV: UTF-8, header row with required columns

## Required CSV headers
- `article`
- `propertyNumber`
- `description`
- `typeOfEquipment`
- `unitOfMeasurement`
- `quantityPerPropertyCard`
- `quantityPerPhysicalCount`
- `remarks`
- `acquisitionDate`
- `acquisitionValue`

## Usage
From `scrpt/`:

### Import from CSV
```bash
node addAss2.js file ./invt.csv
```
- Validates required headers; aborts if any are missing.
- Skips rows whose `article` already exists as a doc id in `assets`.
- Coerces numbers for quantities/value; invalid dates become `null`.

### Single record via CLI args
```bash
node addAss2.js \
  A01 77588 "description" Laptop \
  "unit" 1 1 "remarks" \
  2020-12-01 50000
```

Args (10, in order):
1. `article` (also used as Firestore doc id; duplicate doc is skipped)
2. `propertyNumber`
3. `description`
4. `typeOfEquipment`
5. `unitOfMeasurement`
6. `quantityPerPropertyCard`
7. `quantityPerPhysicalCount`
8. `remarks`
9. `acquisitionDate` (parseable date string; otherwise stored as `null`)
10. `acquisitionValue`

## Behavior notes
- Each new asset gets `createdAt: serverTimestamp()`.
- Duplicate check: uses `article` as doc id; if it exists, that row is skipped.
- Numeric fields fall back to `0` when coercion fails.
- Empty `article` rows are skipped.

## Common errors
- "CSV header error": the file is missing one or more required headers.
- "CSV file not found": the path passed to `file` mode does not exist.
- Firestore auth/permission errors: ensure the service account has write access.
