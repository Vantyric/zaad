import { z } from 'zod'

export const CATEGORIES = {
  produce: 'خضار وفواكه',
  dairy: 'ألبان وبيض',
  grains: 'حبوب ومخبوزات',
  protein: 'لحوم وبقول',
  other: 'أخرى',
} as const
export const LOCATIONS = { fridge: 'الثلاجة', freezer: 'المجمّدة', pantry: 'الرف' } as const
export const UNITS = ['حبة', 'كغ', 'غ', 'لتر', 'مل', 'عبوة', 'ربطة'] as const
export type Category = keyof typeof CATEGORIES
export type Location = keyof typeof LOCATIONS
export const MAX_RECORDS = 500
export const MAX_BACKUP_BYTES = 1_000_000
export const STORAGE_KEY = 'zaad:pantry:v1'

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const year = Number(value.slice(0, 4))
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    year >= 1900 &&
    year <= 2100 &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

export function daysUntil(date: string, today = localDate()): number {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  )
}

export function addDays(days: number, base = localDate()): string {
  return new Date(Date.parse(`${base}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

const text = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine(
    (v) =>
      !Array.from(v).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) &&
      !/[\u202a-\u202e\u2066-\u2069]/.test(v),
  )
const quantity = z
  .number()
  .finite()
  .positive()
  .max(100_000)
  .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 0.00001)
const date = z.string().refine((value) => value === '' || validDate(value))
export const itemInputSchema = z
  .object({
    name: text,
    quantity,
    unit: z.enum(UNITS),
    category: z.enum(['produce', 'dairy', 'grains', 'protein', 'other']),
    location: z.enum(['fridge', 'freezer', 'pantry']),
    date,
    notes: z.string().trim().max(300),
  })
  .strict()
export const itemSchema = itemInputSchema
  .extend({ id: z.uuid(), createdAt: z.iso.datetime() })
  .strict()
export const shoppingInputSchema = z.object({ name: text, quantity, unit: z.enum(UNITS) }).strict()
const shoppingSchema = shoppingInputSchema.extend({ id: z.uuid(), checked: z.boolean() }).strict()
const activitySchema = z
  .object({
    id: z.uuid(),
    name: text,
    quantity,
    unit: z.enum(UNITS),
    kind: z.enum(['used', 'discarded']),
    at: z.iso.datetime(),
  })
  .strict()
const unique = <T extends { id: string }>(rows: T[]) =>
  new Set(rows.map((row) => row.id)).size === rows.length
export const dataSchema = z
  .object({
    version: z.literal(1),
    items: z.array(itemSchema).max(MAX_RECORDS).refine(unique),
    shopping: z.array(shoppingSchema).max(MAX_RECORDS).refine(unique),
    activity: z.array(activitySchema).max(MAX_RECORDS).refine(unique),
  })
  .strict()
export type ItemInput = z.infer<typeof itemInputSchema>
export type Item = z.infer<typeof itemSchema>
export type ShoppingInput = z.infer<typeof shoppingInputSchema>
export type ShoppingItem = z.infer<typeof shoppingSchema>
export type Data = z.infer<typeof dataSchema>
export const emptyData = (): Data => ({ version: 1, items: [], shopping: [], activity: [] })

export function parseBackup(raw: string): Data {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES)
    throw new Error('حجم الملف أكبر من 1 ميغابايت.')
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error('تعذّرت قراءة الملف. اختر نسخة JSON صالحة من زاد.')
  }
  const result = dataSchema.safeParse(json)
  if (!result.success)
    throw new Error('النسخة غير متوافقة أو تحتوي بيانات غير صالحة. لم تتغير بياناتك.')
  return result.data
}

export function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLocaleLowerCase('ar')
}

export type Status = 'expired' | 'soon' | 'later' | 'undated'
export function statusOf(item: Item, today = localDate()): Status {
  if (!item.date) return 'undated'
  const days = daysUntil(item.date, today)
  return days < 0 ? 'expired' : days <= 3 ? 'soon' : 'later'
}

export function statusLabel(item: Item, today = localDate()): string {
  if (!item.date) return 'بلا تاريخ محدد'
  const days = daysUntil(item.date, today)
  if (days < 0) return `تجاوز التاريخ بـ ${dayCount(Math.abs(days))}`
  if (days === 0) return 'التاريخ المحدد اليوم'
  if (days === 1) return 'التاريخ المحدد غداً'
  if (days === 2) return 'التاريخ بعد يومين'
  return `متبقٍ ${dayCount(days)}`
}

function dayCount(days: number): string {
  return days === 1 ? 'يوم واحد' : days === 2 ? 'يومين' : `${days} ${days <= 10 ? 'أيام' : 'يوماً'}`
}

const dateFormatter = new Intl.DateTimeFormat('ar-IQ', {
  day: 'numeric',
  month: 'short',
  numberingSystem: 'latn',
})
const numberFormatter = new Intl.NumberFormat('ar-IQ', {
  maximumFractionDigits: 3,
  numberingSystem: 'latn',
})
const nameCollator = new Intl.Collator('ar')

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`))
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export type Filters = {
  query: string
  category: string
  location: string
  status: string
  sort: string
}
export function filterItems(items: Item[], filters: Filters, today = localDate()): Item[] {
  const query = normalize(filters.query)
  return items
    .filter(
      (item) =>
        (!query || normalize(`${item.name} ${item.notes}`).includes(query)) &&
        (filters.category === 'all' || item.category === filters.category) &&
        (filters.location === 'all' || item.location === filters.location) &&
        (filters.status === 'all' || statusOf(item, today) === filters.status),
    )
    .sort((a, b) => {
      if (filters.sort === 'name') return nameCollator.compare(a.name, b.name)
      if (filters.sort === 'newest') return b.createdAt.localeCompare(a.createdAt)
      return (
        (a.date || '9999').localeCompare(b.date || '9999') || nameCollator.compare(a.name, b.name)
      )
    })
}

export type Action =
  | { type: 'saveItem'; input: ItemInput; id?: string }
  | { type: 'deleteItem'; id: string }
  | {
      type: 'consume'
      id: string
      quantity: number
      kind: 'used' | 'discarded'
      toShopping: boolean
    }
  | { type: 'saveShopping'; input: ShoppingInput; id?: string }
  | { type: 'toggleShopping'; id: string }
  | { type: 'deleteShopping'; id: string }
  | { type: 'clearChecked' }
  | { type: 'replace'; data: Data }

export function reduceData(data: Data, action: Action): Data {
  switch (action.type) {
    case 'replace':
      return dataSchema.parse(action.data)
    case 'saveItem': {
      const input = itemInputSchema.parse(action.input)
      if (action.id) {
        if (!data.items.some((item) => item.id === action.id))
          throw new Error('المادة لم تعد موجودة. أعد فتح المخزن.')
        return {
          ...data,
          items: data.items.map((item) => (item.id === action.id ? { ...item, ...input } : item)),
        }
      }
      if (data.items.length >= MAX_RECORDS)
        throw new Error('وصل المخزن إلى 500 مادة. احذف بعض المواد أولاً.')
      return {
        ...data,
        items: [
          ...data.items,
          { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
        ],
      }
    }
    case 'deleteItem':
      return { ...data, items: data.items.filter((item) => item.id !== action.id) }
    case 'consume': {
      const item = data.items.find((row) => row.id === action.id)
      if (
        !item ||
        !Number.isFinite(action.quantity) ||
        action.quantity <= 0 ||
        action.quantity > item.quantity ||
        !quantity.safeParse(action.quantity).success
      )
        throw new Error('الكمية غير صالحة أو تغيّرت المادة. أعد فتحها وحاول مجدداً.')
      const remaining = Math.round((item.quantity - action.quantity) * 1000) / 1000
      let next: Data = {
        ...data,
        items:
          remaining > 0
            ? data.items.map((row) => (row.id === item.id ? { ...row, quantity: remaining } : row))
            : data.items.filter((row) => row.id !== item.id),
        activity: [
          {
            id: crypto.randomUUID(),
            name: item.name,
            quantity: action.quantity,
            unit: item.unit,
            kind: action.kind,
            at: new Date().toISOString(),
          },
          ...data.activity,
        ].slice(0, MAX_RECORDS),
      }
      if (!remaining && action.toShopping)
        next = reduceData(next, {
          type: 'saveShopping',
          input: { name: item.name, quantity: 1, unit: item.unit },
        })
      return next
    }
    case 'saveShopping': {
      const input = shoppingInputSchema.parse(action.input)
      if (action.id) {
        if (!data.shopping.some((row) => row.id === action.id))
          throw new Error('مادة التسوق لم تعد موجودة. أعد فتح القائمة.')
        return {
          ...data,
          shopping: data.shopping.map((row) => (row.id === action.id ? { ...row, ...input } : row)),
        }
      }
      const duplicate = data.shopping.find(
        (row) =>
          !row.checked && normalize(row.name) === normalize(input.name) && row.unit === input.unit,
      )
      if (duplicate) {
        const total = Math.round((duplicate.quantity + input.quantity) * 1000) / 1000
        if (total > 100_000) throw new Error('الكمية الإجمالية أكبر من الحد المسموح.')
        return {
          ...data,
          shopping: data.shopping.map((row) =>
            row.id === duplicate.id ? { ...row, quantity: total } : row,
          ),
        }
      }
      if (data.shopping.length >= MAX_RECORDS)
        throw new Error('وصلت قائمة التسوق إلى 500 مادة. احذف بعض المواد أولاً.')
      return {
        ...data,
        shopping: [...data.shopping, { ...input, id: crypto.randomUUID(), checked: false }],
      }
    }
    case 'toggleShopping':
      return {
        ...data,
        shopping: data.shopping.map((row) =>
          row.id === action.id ? { ...row, checked: !row.checked } : row,
        ),
      }
    case 'deleteShopping':
      return { ...data, shopping: data.shopping.filter((row) => row.id !== action.id) }
    case 'clearChecked':
      return { ...data, shopping: data.shopping.filter((row) => !row.checked) }
  }
}

export function demoData(): Data {
  const seeds: ItemInput[] = [
    {
      name: 'طماطم',
      quantity: 1.5,
      unit: 'كغ',
      category: 'produce',
      location: 'fridge',
      date: addDays(2),
      notes: 'للسلطة وطبخة الأسبوع',
    },
    {
      name: 'حليب',
      quantity: 2,
      unit: 'عبوة',
      category: 'dairy',
      location: 'fridge',
      date: addDays(1),
      notes: '',
    },
    {
      name: 'جزر',
      quantity: 1,
      unit: 'كغ',
      category: 'produce',
      location: 'fridge',
      date: addDays(7),
      notes: '',
    },
    {
      name: 'خبز',
      quantity: 1,
      unit: 'عبوة',
      category: 'grains',
      location: 'freezer',
      date: addDays(20),
      notes: '',
    },
    {
      name: 'عدس أحمر',
      quantity: 500,
      unit: 'غ',
      category: 'protein',
      location: 'pantry',
      date: addDays(60),
      notes: 'لشوربة دافئة',
    },
    {
      name: 'خس',
      quantity: 1,
      unit: 'حبة',
      category: 'produce',
      location: 'fridge',
      date: addDays(0),
      notes: '',
    },
  ]
  return {
    ...emptyData(),
    items: seeds.map((input) => ({
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })),
  }
}
