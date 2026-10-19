# Patient registration and invoices

Open **Admin → პაციენტები**. Owners and reception staff can register patients, select a patient, enter their personal number/address, and create or edit invoices. Doctors retain read-only access. Existing bookings and visit history remain on the same page.

Select an existing service or type a custom prescription, set the unit price and integer quantity, then save. Invoice numbers are entered by staff and are unique across patients. Prices allow two decimal places and calculations use integer tetri. A saved invoice retains its patient details for historical reprints. Center/bank details are editable per invoice and default to the supplied Georgian reference document.

Select a saved invoice to reopen it. Save edits before using **ბეჭდვა / PDF**. In the print dialog choose A4 and disable browser headers/footers; select Save as PDF to export. Long prescriptions continue onto additional A4 pages. The signature line and stamp space are blank for signing/stamping.

## Data and compatibility

- Adds optional `personalId` and `address` fields to existing patients. No migration or rewriting of existing records is required.
- Adds the MongoDB `invoices` collection, a unique invoice-number index, and an indexed patient reference. Existing MongoDB credentials are reused.
- Existing unique-phone behavior is preserved; duplicate registrations ask staff to use the existing patient record.
- Invoice updates check a revision number and reject stale concurrent edits with HTTP 409.
- API validation and permission checks apply on the server, and audit events record registration/invoice changes.
- Admin backup exports include invoices. No patient data is stored in browser local storage.
- No public pages, logo files, booking behavior, or existing navigation entries are replaced.

## Checks

`npm run build` runs the production build and TypeScript checks.

`node --import tsx --test scripts/invoice.test.ts` checks the reference total (2240 GEL), currency rounding, invalid input, identity validation and partial-update preservation.
