import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'

const storageKey = 'zaad:pantry:v1'
const nav = async (page: Page, route: 'pantry' | 'priority' | 'shopping' | 'activity' | 'data') => {
  const labels = {
    pantry: /^(مخزن البيت|المخزن)$/,
    priority: /^(استخدمه أولاً|الأولوية)/,
    shopping: /^(قائمة التسوق|التسوق)/,
    activity: /^(سجل الاستخدام|السجل)$/,
    data: /^(بياناتي والخصوصية|بياناتي)$/,
  }
  await page.getByRole('navigation').getByRole('button', { name: labels[route] }).click()
}
async function addItem(page: Page, name = 'أرز بسمتي', quantity = '2.5') {
  await page.getByRole('button', { name: 'إضافة مادة', exact: true }).first().click()
  const modal = page.getByRole('dialog')
  await modal.getByRole('textbox', { name: /اسم المادة/ }).fill(name)
  await modal.getByRole('spinbutton', { name: /الكمية/ }).fill(quantity)
  await modal.getByRole('combobox', { name: 'التصنيف', exact: true }).selectOption('grains')
  await modal.getByRole('combobox', { name: 'مكان الحفظ', exact: true }).selectOption('pantry')
  await modal.getByRole('button', { name: 'إضافة للمخزن', exact: true }).click()
  await expect(modal).not.toBeVisible()
}
async function demo(page: Page) {
  await page.getByRole('button', { name: /جرّب مخزناً توضيحياً/ }).click()
  await expect(page.getByRole('article')).toHaveCount(6)
  await page.getByRole('button', { name: 'إغلاق الإشعار' }).click()
}
async function noOverflow(page: Page) {
  await expect
    .poll(async () => await page.evaluate(() => document.documentElement.scrollWidth), {
      message: 'Page content must fit the viewport, including after resize',
      timeout: 4000,
    })
    .toBeLessThanOrEqual(page.viewportSize()!.width + 1)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('scenario 1: add, edit, persist, Arabic search/filter, cancel and confirm delete', async ({
  page,
}) => {
  await expect(page.getByRole('article')).toHaveCount(0)
  await addItem(page)
  let card = page.getByRole('article', { name: 'أرز بسمتي', exact: true })
  await expect(card).toContainText('2.5')
  await card.getByRole('button', { name: 'تعديل أرز بسمتي' }).click()
  await page
    .getByRole('dialog')
    .getByRole('spinbutton', { name: /الكمية/ })
    .fill('3')
  await page.getByRole('button', { name: 'حفظ التعديلات' }).click()
  await page.reload()
  await page.getByRole('searchbox', { name: 'البحث في المخزن' }).fill('ارز')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: /حبوب ومخبوزات/ }).click()
  await page.getByLabel('تصفية مكان الحفظ', { exact: true }).selectOption('pantry')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByLabel('تصفية مكان الحفظ', { exact: true }).selectOption('fridge')
  await expect(page.getByRole('heading', { name: 'ما لقينا مادة بهالمواصفات' })).toBeVisible()
  await page.getByRole('button', { name: 'مسح التصفية' }).click()
  card = page.getByRole('article', { name: 'أرز بسمتي', exact: true })
  await expect(card).toContainText('3')
  await card.getByRole('button', { name: 'حذف أرز بسمتي' }).click()
  await page.getByRole('button', { name: 'إلغاء', exact: true }).click()
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'حذف أرز بسمتي' }).click()
  await page.getByRole('button', { name: 'حذف المادة', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(0)
  await noOverflow(page)
})

test('scenario 2: partial use, depletion, real history and shopping lifecycle', async ({
  page,
}) => {
  await addItem(page)
  const card = page.getByRole('article', { name: 'أرز بسمتي' })
  await card.getByRole('button', { name: 'سجّل الاستخدام' }).click()
  await page.getByRole('dialog').getByRole('spinbutton').fill('0.5')
  await page.getByRole('button', { name: 'تسجيل الاستخدام', exact: true }).click()
  await expect(card.locator('.quantity')).toContainText('2')
  await card.getByRole('button', { name: 'سجّل الاستخدام' }).click()
  await page.getByRole('button', { name: 'تسجيل الاستخدام', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(0)
  await nav(page, 'activity')
  await expect(page.locator('.activity-row')).toHaveCount(2)
  await expect(page.locator('.activity-row').last()).toContainText('0.5')
  await nav(page, 'shopping')
  await expect(page.locator('.shopping-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'تعديل شراء أرز بسمتي' }).click()
  await page.getByRole('dialog').getByRole('spinbutton').fill('4')
  await page.getByRole('button', { name: 'حفظ التعديل', exact: true }).click()
  await expect(page.locator('.shopping-row')).toContainText('4')
  await page.getByRole('checkbox', { name: /أرز بسمتي/ }).check()
  await expect(page.getByRole('checkbox', { name: /أرز بسمتي/ })).toBeChecked()
  await page.getByRole('button', { name: 'مسح المشتريات المكتملة' }).click()
  await page.getByRole('button', { name: 'مسح المكتملة', exact: true }).click()
  await expect(page.locator('.shopping-row')).toHaveCount(0)
  await nav(page, 'activity')
  await expect(page.locator('.activity-row')).toHaveCount(2)
})

test('scenario 3: export, reject malformed import, preview/cancel and restore backup', async ({
  page,
}) => {
  await addItem(page)
  await nav(page, 'data')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'تنزيل نسخة احتياطية', exact: true }).click()
  const download = await downloadPromise
  const path = await download.path()
  const backup = JSON.parse(await readFile(path!, 'utf8'))
  expect(backup.items[0].name).toBe('أرز بسمتي')
  await page.getByRole('button', { name: 'تنزيل نسخة احتياطية', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'استعادة من ملف', exact: true })).toBeFocused()
  const upload = page.getByLabel('اختيار نسخة احتياطية')
  await upload.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  })
  await expect(page.getByRole('alert').last()).toContainText('تعذّرت قراءة الملف')
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).items.length, storageKey),
  ).toBe(1)
  await upload.setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  await expect(page.getByRole('heading', { name: 'راجع النسخة قبل الاستعادة' })).toBeVisible()
  await page.getByRole('button', { name: 'إلغاء', exact: true }).click()
  await page.getByRole('button', { name: 'مسح كل البيانات', exact: true }).click()
  await page.getByRole('button', { name: 'نعم، مسح كل البيانات' }).click()
  await upload.setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  await page.getByRole('button', { name: 'استبدال البيانات بهذه النسخة' }).click()
  await nav(page, 'pantry')
  await expect(page.getByRole('article', { name: 'أرز بسمتي' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('article')).toHaveCount(1)
})

test('keyboard validation, modal focus containment and Escape return focus', async ({ page }) => {
  const add = page.getByRole('button', { name: 'إضافة مادة', exact: true }).first()
  await add.click()
  const modal = page.getByRole('dialog')
  await expect(modal.getByRole('textbox', { name: /اسم المادة/ })).toBeFocused()
  await modal.getByRole('button', { name: 'إضافة للمخزن' }).click()
  await expect(modal.getByRole('alert')).toContainText('راجع الحقول')
  await expect(modal.getByRole('textbox', { name: /اسم المادة/ })).toBeFocused()
  await modal.getByRole('textbox', { name: /اسم المادة/ }).fill('اختبار')
  await modal.getByRole('spinbutton').fill('-1')
  await modal.getByRole('button', { name: 'إضافة للمخزن' }).click()
  await expect(modal.getByText(/أدخل كمية أكبر/)).toBeVisible()
  await expect(modal.getByRole('spinbutton')).toBeFocused()
  await modal.getByRole('button', { name: 'إلغاء', exact: true }).focus()
  await page.keyboard.press('Tab')
  expect(
    await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement)),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(modal).not.toBeVisible()
  await expect(add).toBeFocused()
})

test('skip link preserves the selected screen and moves focus to its content', async ({ page }) => {
  await nav(page, 'shopping')
  await page.getByRole('link', { name: 'انتقل إلى المحتوى' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await expect(page.getByRole('heading', { name: 'قائمة مرتّبة، مشوار أخف' })).toBeVisible()
})

test('corrupt storage is preserved until explicit recovery', async ({ page }) => {
  await page.evaluate((key) => localStorage.setItem(key, '{corrupt'), storageKey)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'بيانات محفوظة تحتاج مراجعة' })).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('button').first()).toBeDisabled()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe('{corrupt')
  await page.getByRole('button', { name: 'مسح كل البيانات', exact: true }).click()
  await page.getByRole('button', { name: 'إلغاء', exact: true }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe('{corrupt')
})

test('quota failures keep edits in the session and surface recovery guidance', async ({ page }) => {
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return original.call(this, name, value)
    }
  }, storageKey)
  await page.reload()
  await addItem(page)
  await expect(page.getByRole('article', { name: 'أرز بسمتي' })).toBeVisible()
  await expect(page.getByRole('alert').first()).toContainText('تعذّر الحفظ')
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
  await nav(page, 'data')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'تنزيل نسخة احتياطية', exact: true }).click()
  const file = await download
  const path = await file.path()
  expect(JSON.parse(await readFile(path!, 'utf8')).items[0].name).toBe('أرز بسمتي')
})

test('same-origin tabs receive updates and application assets stay local', async ({
  page,
  context,
}) => {
  const requests: string[] = []
  const errors: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('pageerror', (error) => errors.push(error.message))
  await page.reload()
  const second = await context.newPage()
  await second.goto('/')
  await expect(second.getByRole('heading', { level: 1 })).toBeVisible()
  await addItem(page)
  await expect(second.getByRole('article', { name: 'أرز بسمتي' })).toBeVisible()
  await expect(second.getByRole('status').last()).toContainText('نافذة أخرى')
  expect(requests.filter((url) => !url.startsWith('http://127.0.0.1:4173/'))).toEqual([])
  expect(errors).toEqual([])
  await second.close()
})

test('stored HTML is inert and oversized imports are rejected', async ({ page }) => {
  await addItem(page, '<img src=x onerror=alert(1)>')
  await expect(page.getByRole('article')).toContainText('<img src=x onerror=alert(1)>')
  await expect(page.getByRole('article').locator('img')).toHaveCount(0)
  await nav(page, 'data')
  await page.getByLabel('اختيار نسخة احتياطية').setInputFiles({
    name: 'large.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(1_000_001, ' '),
  })
  await expect(page.getByRole('alert').last()).toContainText('أكبر من 1 ميغابايت')
})

test('RTL, reduced motion, 320px and 200% zoom layout; print styles', async ({ page }) => {
  await demo(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await noOverflow(page)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    'auto',
  )
  await page.setViewportSize({ width: 320, height: 740 })
  await noOverflow(page)
  await nav(page, 'shopping')
  await page.getByRole('textbox', { name: 'ماذا تحتاج؟' }).fill('زيت زيتون')
  await page.getByRole('button', { name: 'إضافة', exact: true }).click()
  await noOverflow(page)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.sidebar')).not.toBeVisible()
  await expect(page.locator('.shopping-form')).not.toBeVisible()
  await expect(page.locator('.shopping-row')).toBeVisible()
  await page.emulateMedia({ media: 'screen' })
  await page.setViewportSize({ width: 720, height: 500 })
  await page.locator('html').evaluate((el) => {
    ;(el as HTMLElement).style.zoom = '2'
  })
  await noOverflow(page)
})

test('accessibility and real product screenshots across all screens and editor', async ({
  page,
}, testInfo) => {
  await demo(page)
  await page
    .getByRole('article', { name: 'طماطم', exact: true })
    .getByRole('button', { name: 'سجّل الاستخدام' })
    .click()
  await page.getByRole('dialog').getByRole('spinbutton').fill('0.5')
  await page.getByRole('button', { name: 'تسجيل الاستخدام', exact: true }).click()
  await page
    .getByRole('article', { name: 'جزر', exact: true })
    .getByRole('button', { name: 'سجّل الاستخدام' })
    .click()
  await page.getByRole('dialog').getByRole('radio', { name: 'تخلّصت منها' }).check()
  await page.getByRole('dialog').getByRole('spinbutton').fill('0.25')
  await page.getByRole('button', { name: 'تسجيل التخلّص', exact: true }).click()
  await page.getByRole('button', { name: 'إغلاق الإشعار' }).click()
  await page.evaluate(() => document.fonts.ready)
  const prefix = testInfo.project.name.startsWith('mobile') ? 'mobile' : 'desktop'
  const violations: {
    screen: string
    id: string
    impact: string | null | undefined
    nodes: { target: string[]; message: string | undefined }[]
  }[] = []
  for (const screen of ['pantry', 'priority', 'shopping', 'activity', 'data'] as const) {
    await nav(page, screen)
    if (screen === 'shopping') {
      for (const name of ['زيت زيتون', 'بيض']) {
        await page.getByRole('textbox', { name: 'ماذا تحتاج؟' }).fill(name)
        await page.getByRole('combobox', { name: 'الوحدة', exact: true }).selectOption('عبوة')
        await page.getByRole('button', { name: 'إضافة', exact: true }).click()
      }
      await page.getByRole('checkbox', { name: /بيض/ }).check()
      await page.getByRole('button', { name: 'إغلاق الإشعار' }).click()
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await noOverflow(page)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    violations.push(
      ...results.violations.map((v) => ({
        screen,
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target as string[], message: n.failureSummary })),
      })),
    )
    if (screen === 'pantry' || prefix === 'desktop')
      await page.screenshot({ path: `docs/screenshots/${prefix}-${screen}.png`, fullPage: true })
    if (screen === 'pantry')
      await page.screenshot({ path: `docs/screenshots/${prefix}-overview.png` })
  }
  await nav(page, 'pantry')
  await page.getByRole('button', { name: 'إضافة مادة', exact: true }).first().click()
  const modalResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  violations.push(
    ...modalResults.violations.map((v) => ({
      screen: 'editor',
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target as string[], message: n.failureSummary })),
    })),
  )
  await page.screenshot({ path: `docs/screenshots/${prefix}-editor.png`, fullPage: true })
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
})

test('long ingredient text and large quantities remain usable at every breakpoint', async ({
  page,
}) => {
  const name = 'PantryItem'.repeat(8)
  await addItem(page, name, '99999.999')
  const card = page.getByRole('article', { name, exact: true })
  await card.getByRole('button', { name: `تعديل ${name}`, exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('textbox', { name: /ملاحظة/ })
    .fill('ملاحظة طويلة للتأكد من القراءة والمحاذاة. '.repeat(7))
  await page.getByRole('button', { name: 'حفظ التعديلات' }).click()
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await noOverflow(page)
    await expect(card.getByRole('heading')).toHaveText(name)
    expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    )
  }
  const edit = card.getByRole('button', { name: `تعديل ${name}`, exact: true })
  await edit.scrollIntoViewIfNeeded()
  const target = await edit.boundingBox()
  expect(target!.height).toBeGreaterThanOrEqual(44)
  expect(target!.width).toBeGreaterThanOrEqual(44)
  await expect(page.getByRole('navigation')).toBeInViewport()
})

test('success feedback pauses while read, then clears; errors stay visible', async ({ page }) => {
  await page.clock.install()
  await addItem(page)
  const toast = page.locator('.toast')
  await toast.hover()
  await page.clock.fastForward(9000)
  await expect(toast).toBeVisible()
  await page.mouse.move(0, 0)
  await page.clock.runFor(50)
  await page.clock.fastForward(8500)
  await expect(toast).not.toBeVisible()
  await nav(page, 'data')
  await page.getByLabel('اختيار نسخة احتياطية').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  })
  await expect(page.getByRole('alert')).toContainText('تعذّرت قراءة الملف')
  await page.clock.fastForward(30000)
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'إغلاق الإشعار' }).click()
  await expect(page.getByRole('alert')).not.toBeVisible()
})
