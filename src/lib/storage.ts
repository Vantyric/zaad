import { emptyData, parseBackup, STORAGE_KEY, type Data } from './model'

export type Loaded = { data: Data; error: string; corrupt: boolean; raw: string | null }
export function loadData(storage?: Pick<Storage, 'getItem'>): Loaded {
  let raw: string | null = null
  try {
    raw = (storage ?? window.localStorage).getItem(STORAGE_KEY)
    return { data: raw ? parseBackup(raw) : emptyData(), error: '', corrupt: false, raw }
  } catch {
    return {
      data: emptyData(),
      error: raw
        ? 'تعذّرت قراءة البيانات المحفوظة. احتفظ بنسخة منها ثم استعد نسخة سليمة أو ابدأ من جديد.'
        : 'التخزين غير متاح. يمكنك العمل مؤقتاً وتصدير نسخة قبل إغلاق الصفحة.',
      corrupt: raw !== null,
      raw,
    }
  }
}

export function saveData(data: Data, storage?: Pick<Storage, 'setItem'>): string {
  try {
    ;(storage ?? window.localStorage).setItem(STORAGE_KEY, JSON.stringify(data))
    return ''
  } catch {
    return 'تعذّر الحفظ في المتصفح. تغييراتك موجودة في هذه الجلسة؛ نزّل نسخة احتياطية قبل إغلاقها.'
  }
}

export function downloadJson(raw: string, filename: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
