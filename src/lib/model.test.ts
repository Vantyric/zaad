import { describe, expect, it } from 'vitest'
import {
  addDays,
  dataSchema,
  daysUntil,
  demoData,
  emptyData,
  filterItems,
  itemInputSchema,
  localDate,
  normalize,
  parseBackup,
  reduceData,
  statusLabel,
  statusOf,
  validDate,
  type Data,
  type ItemInput,
} from './model'

const input: ItemInput = {
  name: 'أرز',
  quantity: 2.5,
  unit: 'كغ',
  category: 'grains',
  location: 'pantry',
  date: '2026-11-15',
  notes: '',
}
const withItem = () => reduceData(emptyData(), { type: 'saveItem', input })
const filters = { query: '', category: 'all', location: 'all', status: 'all', sort: 'date' }

describe('civil dates and reminders', () => {
  it.each(['2024-02-29', '2026-11-12', '1900-01-01', '2100-12-31'])(
    'accepts real date %s',
    (date) => expect(validDate(date)).toBe(true),
  )
  it.each([
    '2026-02-29',
    '2026-99-99',
    '2026-04-31',
    '2026-00-01',
    '2026-1-2',
    '1899-12-31',
    '2101-01-01',
    'bad',
  ])('rejects invalid date %s without throwing', (date) => expect(validDate(date)).toBe(false))
  it('compares calendar days through DST independently of clock hours', () => {
    expect(daysUntil('2026-03-09', '2026-03-07')).toBe(2)
    expect(daysUntil('2026-01-01', '2025-12-31')).toBe(1)
  })
  it('adds days across month boundaries', () => expect(addDays(2, '2024-02-28')).toBe('2024-03-01'))
  it('uses the browser local date instead of an ISO UTC date', () =>
    expect(localDate(new Date(2026, 10, 12, 0, 30))).toBe('2026-11-12'))
  it.each([
    ['2026-11-11', 'expired'],
    ['2026-11-12', 'soon'],
    ['2026-11-15', 'soon'],
    ['2026-11-16', 'later'],
    ['', 'undated'],
  ])('classifies %s as %s', (date, expected) =>
    expect(statusOf({ ...withItem().items[0], date }, '2026-11-12')).toBe(expected),
  )
  it('describes reminders without claiming food is safe', () => {
    expect(statusLabel(withItem().items[0], '2026-11-15')).toBe('التاريخ المحدد اليوم')
    expect(statusLabel(withItem().items[0], '2026-11-16')).toContain('تجاوز التاريخ')
  })
})

describe('input boundaries', () => {
  it.each([0, -1, Number.NaN, Infinity, 100001, 0.0001])(
    'rejects invalid quantity %s',
    (quantity) => expect(itemInputSchema.safeParse({ ...input, quantity }).success).toBe(false),
  )
  it('allows fractional quantities and trims text', () =>
    expect(itemInputSchema.parse({ ...input, name: '  أرز  ', quantity: 0.125 }).name).toBe('أرز'))
  it('rejects blank names, long notes, unknown units and directional control characters', () => {
    for (const patch of [
      { name: '   ' },
      { notes: 'x'.repeat(301) },
      { unit: 'barrel' },
      { name: '\u202eخادع' },
    ])
      expect(itemInputSchema.safeParse({ ...input, ...patch }).success).toBe(false)
  })
})

describe('inventory and activity', () => {
  it('adds, edits and deletes a real record without mutating previous state', () => {
    const original = withItem()
    const id = original.items[0].id
    const edited = reduceData(original, { type: 'saveItem', input: { ...input, name: 'عدس' }, id })
    expect(edited.items[0].name).toBe('عدس')
    expect(original.items[0].name).toBe('أرز')
    expect(reduceData(edited, { type: 'deleteItem', id }).items).toHaveLength(0)
  })
  it('records partial use with precise decimal subtraction', () => {
    const data = reduceData(emptyData(), { type: 'saveItem', input: { ...input, quantity: 0.3 } })
    const next = reduceData(data, {
      type: 'consume',
      id: data.items[0].id,
      quantity: 0.1,
      kind: 'used',
      toShopping: true,
    })
    expect(next.items[0].quantity).toBe(0.2)
    expect(next.activity[0].quantity).toBe(0.1)
    expect(next.shopping).toHaveLength(0)
  })
  it('removes depleted stock, records disposal and adds one unit to shopping', () => {
    const data = withItem()
    const next = reduceData(data, {
      type: 'consume',
      id: data.items[0].id,
      quantity: 2.5,
      kind: 'discarded',
      toShopping: true,
    })
    expect(next.items).toHaveLength(0)
    expect(next.activity[0].kind).toBe('discarded')
    expect(next.shopping[0]).toMatchObject({ name: 'أرز', quantity: 1, unit: 'كغ', checked: false })
  })
  it('does not add shopping when the user opts out', () => {
    const data = withItem()
    expect(
      reduceData(data, {
        type: 'consume',
        id: data.items[0].id,
        quantity: 2.5,
        kind: 'used',
        toShopping: false,
      }).shopping,
    ).toHaveLength(0)
  })
  it.each([0, -1, 3, Infinity, 0.0001])('rejects invalid consumption %s atomically', (quantity) => {
    const data = withItem()
    expect(() =>
      reduceData(data, {
        type: 'consume',
        id: data.items[0].id,
        quantity,
        kind: 'used',
        toShopping: false,
      }),
    ).toThrow()
    expect(data.items[0].quantity).toBe(2.5)
    expect(data.activity).toHaveLength(0)
  })
  it('rejects stale edits and consumption of missing stock', () => {
    expect(() =>
      reduceData(emptyData(), { type: 'saveItem', input, id: crypto.randomUUID() }),
    ).toThrow()
    expect(() =>
      reduceData(emptyData(), {
        type: 'consume',
        id: 'missing',
        quantity: 1,
        kind: 'used',
        toShopping: false,
      }),
    ).toThrow()
  })
  it('retains previous activity when deleting stock', () => {
    let data = withItem()
    const id = data.items[0].id
    data = reduceData(data, { type: 'consume', id, quantity: 1, kind: 'used', toShopping: false })
    expect(reduceData(data, { type: 'deleteItem', id }).activity).toHaveLength(1)
  })
  it('caps the activity ledger at the most recent 500 events', () => {
    const data = withItem()
    data.activity = Array.from({ length: 500 }, () => ({
      id: crypto.randomUUID(),
      name: 'أرز',
      quantity: 1,
      unit: 'كغ',
      kind: 'used',
      at: '2026-11-12T00:00:00.000Z',
    }))
    const next = reduceData(data, {
      type: 'consume',
      id: data.items[0].id,
      quantity: 1,
      kind: 'used',
      toShopping: false,
    })
    expect(next.activity).toHaveLength(500)
    expect(next.activity[0].at).not.toBe('2026-11-12T00:00:00.000Z')
  })
  it('refuses the 501st item', () => {
    const data = withItem()
    data.items = Array.from({ length: 500 }, () => ({ ...data.items[0], id: crypto.randomUUID() }))
    expect(() => reduceData(data, { type: 'saveItem', input })).toThrow()
  })
})

describe('Arabic search and filters', () => {
  it('normalizes diacritics, alef, tatweel and ta marbuta', () => {
    expect(normalize('أَرْز')).toBe(normalize('ارز'))
    expect(normalize('طـماطمة')).toBe(normalize('طماطمه'))
  })
  it('combines search with location, category and date filters', () => {
    const data = withItem()
    expect(
      filterItems(
        data.items,
        { ...filters, query: 'ارز', category: 'grains', location: 'pantry', status: 'soon' },
        '2026-11-12',
      ),
    ).toHaveLength(1)
    expect(
      filterItems(data.items, { ...filters, query: 'ارز', location: 'fridge' }, '2026-11-12'),
    ).toHaveLength(0)
  })
  it('searches notes and sorts undated items last without mutating source', () => {
    const data = withItem()
    data.items = [
      { ...data.items[0], date: '', notes: 'أول رف' },
      { ...data.items[0], id: crypto.randomUUID(), date: '2026-11-13' },
    ]
    expect(filterItems(data.items, { ...filters, query: 'اول' })).toHaveLength(1)
    expect(filterItems(data.items, filters)[0].date).toBe('2026-11-13')
    expect(data.items[0].date).toBe('')
  })
})

describe('shopping list', () => {
  const add = (data: Data, name = 'أرز', quantity = 1) =>
    reduceData(data, { type: 'saveShopping', input: { name, quantity, unit: 'كغ' } })
  it('merges normalized duplicate active names with the same unit', () => {
    const next = add(add(emptyData()), 'ارز', 2)
    expect(next.shopping).toHaveLength(1)
    expect(next.shopping[0].quantity).toBe(3)
  })
  it('does not merge distinct units or completed purchases', () => {
    let data = add(emptyData())
    data = reduceData(data, { type: 'toggleShopping', id: data.shopping[0].id })
    data = add(data)
    data = reduceData(data, {
      type: 'saveShopping',
      input: { name: 'أرز', quantity: 500, unit: 'غ' },
    })
    expect(data.shopping).toHaveLength(3)
  })
  it('edits, checks, clears checked and removes a shopping item', () => {
    let data = add(add(emptyData()), 'عدس')
    const id = data.shopping[0].id
    data = reduceData(data, {
      type: 'saveShopping',
      input: { name: 'أرز', quantity: 4, unit: 'كغ' },
      id,
    })
    expect(data.shopping[0].quantity).toBe(4)
    data = reduceData(data, { type: 'toggleShopping', id })
    data = reduceData(data, { type: 'clearChecked' })
    expect(data.shopping).toHaveLength(1)
    expect(
      reduceData(data, { type: 'deleteShopping', id: data.shopping[0].id }).shopping,
    ).toHaveLength(0)
  })
  it('rejects a merge that exceeds the quantity limit', () =>
    expect(() => add(add(emptyData(), 'أرز', 100000))).toThrow())
})

describe('portable backups', () => {
  it('round-trips all real data and the opt-in demo through strict validation', () => {
    const data = demoData()
    expect(parseBackup(JSON.stringify(data))).toEqual(data)
    expect(dataSchema.parse(data).items).toHaveLength(6)
  })
  it.each(['{bad', '{}', '{"version":2,"items":[],"shopping":[],"activity":[]}'])(
    'rejects invalid or unsupported backup %s',
    (raw) => expect(() => parseBackup(raw)).toThrow(),
  )
  it('rejects unknown fields, duplicate IDs and impossible dates', () => {
    const data = withItem()
    expect(() => parseBackup(JSON.stringify({ ...data, script: '<script>' }))).toThrow()
    expect(() =>
      parseBackup(JSON.stringify({ ...data, items: [data.items[0], data.items[0]] })),
    ).toThrow()
    expect(() =>
      parseBackup(JSON.stringify({ ...data, items: [{ ...data.items[0], date: '2026-99-99' }] })),
    ).toThrow()
  })
  it('rejects oversized files before parsing and excess records', () => {
    expect(() => parseBackup(' '.repeat(1_000_001))).toThrow('1 ميغابايت')
    const data = withItem()
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...data,
          items: Array.from({ length: 501 }, () => ({ ...data.items[0], id: crypto.randomUUID() })),
        }),
      ),
    ).toThrow()
  })
  it('preserves markup as inert text rather than interpreting HTML', () => {
    const data = reduceData(emptyData(), {
      type: 'saveItem',
      input: { ...input, name: '<img src=x onerror=alert(1)>' },
    })
    expect(parseBackup(JSON.stringify(data)).items[0].name).toContain('<img')
  })
})
