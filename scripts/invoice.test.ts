import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centerDefaults, invoiceSchema, invoiceTotal, lineTotal, registrationSchema, patientFields } from '../lib/invoice';

const invoice = { number: '2', date: '2026-10-15', center: centerDefaults, items: [{ description: 'სამკურნალო ვარჯიში', unitPrice: 50, quantity: 20 }, { description: 'სამკურნალო მასაჟი', unitPrice: 50, quantity: 20 }, { description: 'ფიზიოთერაპია', unitPrice: 30, quantity: 8 }] };
test('photographed calculation totals 2240 GEL', () => {
  assert.ok(invoiceSchema.safeParse(invoice).success);
  assert.equal(invoiceTotal(invoice.items), 224000);
});
test('currency calculations use integer cents', () => {
  assert.equal(lineTotal({ description: 'test', unitPrice: 0.29, quantity: 3 }), 87);
  assert.equal(invoiceTotal([{ description: 'test', unitPrice: 1.01, quantity: 100 }]), 10100);
});
test('rejects invalid dates, empty procedures and unsafe amounts', () => {
  for (const date of ['2026-02-30', '2026-13-01', 'not-a-date']) assert.equal(invoiceSchema.safeParse({ ...invoice, date }).success, false);
  assert.equal(invoiceSchema.safeParse({ ...invoice, items: [] }).success, false);
  for (const patch of [{ quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { unitPrice: -1 }, { unitPrice: 0.001 }, { unitPrice: Infinity }, { description: '' }]) {
    assert.equal(invoiceSchema.safeParse({ ...invoice, items: [{ ...invoice.items[0], ...patch }] }).success, false);
  }
});
test('registration validates identity and normalizes phone without losing leading zeroes', () => {
  const result = registrationSchema.parse({ name: 'ტესტი პაციენტი', phone: '555 00 00 00', personalId: '01000000000' });
  assert.equal(result.phone, '555000000'); assert.equal(result.personalId, '01000000000');
  assert.equal(registrationSchema.safeParse({ name: 'ტესტი', phone: '123' }).success, false);
  assert.equal(registrationSchema.safeParse({ name: 'ტესტი', phone: '555000000', personalId: '123' }).success, false);
  assert.deepEqual(patientFields.partial().parse({ name: 'ტესტი' }), { name: 'ტესტი' });
});
