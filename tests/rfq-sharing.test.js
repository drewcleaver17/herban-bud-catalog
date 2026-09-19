import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildRFQURL, EMPTY_RFQ, readRFQFromURL, rfqAsText } from '../src/lib/rfq.js'

const sample = () => ({
  cart: { 1: 5, 3: 2 },
  contact: {
    ...EMPTY_RFQ.contact,
    name: 'Sample Buyer', company: 'Example Supply', email: 'buyer@example.com',
    phone: '202-555-0100', street: '123 Example Street', street2: 'Suite 2',
    city: 'Example City', state: 'TX', zip: '00000',
    delivery: 'Private delivery instructions', payment: 'cc', notes: 'Private notes',
    futurePrivateField: 'Must not travel in URLs',
  },
})

test('new links contain only product quantities and the allowed payment choice', () => {
  const rfq = sample()
  const original = structuredClone(rfq)
  const url = new URL(buildRFQURL(rfq, 'https://catalog.example.com/'))
  assert.deepEqual([...url.searchParams.keys()], ['rfq', 'pm'])
  assert.equal(url.searchParams.get('rfq'), '1:5,3:2')
  assert.equal(url.searchParams.get('pm'), 'cc')
  for (const [key, value] of Object.entries(rfq.contact)) {
    if (key !== 'payment') assert.ok(!decodeURIComponent(url.href).includes(value))
  }
  assert.deepEqual(rfq, original, 'sharing must not delete locally held contact details')
})

test('an old URL used as the base cannot reintroduce personal information', () => {
  const url = new URL(buildRFQURL(sample(), 'https://catalog.example.com/shop/?n=OldBuyer&e=old%40example.com#private-notes'))
  assert.equal(url.pathname, '/shop/')
  assert.equal(url.hash, '')
  assert.deepEqual([...url.searchParams.keys()], ['rfq', 'pm'])
  assert.ok(!url.href.includes('OldBuyer'))
})

test('product links work before contact or payment information is entered', () => {
  for (const contact of [{}, { payment: 'private free text' }, { payment: 'ach' }]) {
    const url = new URL(buildRFQURL({ cart: { 1: 2 }, contact }, 'https://catalog.example.com/'))
    assert.equal(url.searchParams.get('rfq'), '1:2')
    assert.equal(url.searchParams.get('pm'), contact.payment === 'ach' ? 'ach' : null)
  }
})

test('the reader opens both new product links and existing full RFQ links', (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'window', previous)
    else delete globalThis.window
  })
  const url = new URL(buildRFQURL(sample(), 'https://catalog.example.com/'))
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: url } })
  assert.deepEqual(readRFQFromURL(), {
    cart: { 1: 5, 3: 2 }, contact: { ...EMPTY_RFQ.contact, payment: 'cc' },
  })
  window.location = new URL('https://catalog.example.com/?rfq=1%3A2&n=Legacy&street=Example&pm=ach')
  assert.equal(readRFQFromURL().contact.name, 'Legacy')
  assert.equal(readRFQFromURL().contact.street, 'Example')
  assert.equal(readRFQFromURL().contact.payment, 'ach')
})

test('explicit full-text export retains recipient information and quote totals', () => {
  const text = rfqAsText([
    { id: 1, sku: 'DEMO-1', name: 'Example product', brand: 'Example', category: 'Demo', wholesale: 10, msrp: 20 },
    { id: 3, sku: 'DEMO-3', name: 'Another product', brand: 'Example', category: 'Demo', wholesale: 25, msrp: 50 },
  ], sample(), { now: new Date('2026-09-19T12:00:00Z') })
  for (const value of ['Sample Buyer', 'buyer@example.com', '202-555-0100', '123 Example Street', 'Private notes']) {
    assert.ok(text.includes(value))
  }
  assert.ok(text.includes('Subtotal: $100.00'))
  assert.ok(text.includes('Total due: $104.00'))
})
