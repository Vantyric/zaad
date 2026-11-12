import { describe, expect, it, vi } from 'vitest'
import { demoData, emptyData, STORAGE_KEY } from './model'
import { loadData, saveData } from './storage'

describe('local persistence and recovery', () => {
  it('starts empty without silently preloading or writing demo data', () => {
    const storage = { getItem: vi.fn(() => null) }
    expect(loadData(storage).data).toEqual(emptyData())
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
  })
  it('persists and reloads an inventory', () => {
    const data = demoData()
    expect(saveData(data)).toBe('')
    expect(loadData().data).toEqual(data)
  })
  it('keeps a corrupt original available and blocks normal writes at the application layer', () => {
    localStorage.setItem(STORAGE_KEY, '{corrupt')
    const result = loadData()
    expect(result.corrupt).toBe(true)
    expect(result.raw).toBe('{corrupt')
    expect(result.error).not.toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{corrupt')
  })
  it('handles blocked storage reads gracefully', () => {
    const result = loadData({
      getItem: () => {
        throw new DOMException('blocked')
      },
    })
    expect(result.corrupt).toBe(false)
    expect(result.error).toContain('التخزين غير متاح')
  })
  it('reports quota failures without claiming data was saved', () =>
    expect(
      saveData(demoData(), {
        setItem: () => {
          throw new DOMException('QuotaExceededError')
        },
      }),
    ).toContain('تعذّر الحفظ'))
})
