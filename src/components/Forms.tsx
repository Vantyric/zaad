import { useState, type FormEvent } from 'react'
import { CalendarDays, Check, Info, Plus } from 'lucide-react'
import {
  CATEGORIES,
  LOCATIONS,
  UNITS,
  itemInputSchema,
  shoppingInputSchema,
  formatNumber,
  type Item,
  type ItemInput,
  type ShoppingInput,
  type ShoppingItem,
} from '../lib/model'
import { Modal } from './Modal'

const fieldMessages: Record<string, string> = {
  name: 'اكتب اسماً واضحاً من 1 إلى 80 حرفاً، بلا رموز تحكم.',
  quantity: 'أدخل كمية أكبر من صفر وحتى 100000، بثلاث منازل عشرية كحد أقصى.',
  date: 'اختر تاريخاً صالحاً بين 1900 و2100 أو اتركه فارغاً.',
  notes: 'الملاحظات حتى 300 حرف.',
}

export function ItemForm({
  item,
  onSave,
  onClose,
}: {
  item?: Item
  onSave: (input: ItemInput, id?: string) => boolean
  onClose: () => void
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const result = itemInputSchema.safeParse({
      name: fields.get('name'),
      quantity: Number(fields.get('quantity')),
      unit: fields.get('unit'),
      category: fields.get('category'),
      location: fields.get('location'),
      date: fields.get('date'),
      notes: fields.get('notes'),
    })
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            issue.path[0],
            fieldMessages[String(issue.path[0])] || 'تحقق من القيمة.',
          ]),
        ),
      )
      return
    }
    if (onSave(result.data, item?.id)) onClose()
    else setErrors({ submit: 'تعذّر الحفظ. أعد فتح النافذة وتحقق من الحد الأقصى لعدد المواد.' })
  }
  return (
    <Modal
      title={item ? 'تعديل المادة' : 'أضف خيراً لمخزنك'}
      subtitle="تفاصيل بسيطة الآن، هدر أقل بعدين."
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="item-form">
        <label className="field full">
          اسم المادة <span className="required">*</span>
          <input
            name="name"
            placeholder="مثلاً: طماطم، حليب، عدس…"
            defaultValue={item?.name}
            maxLength={80}
            autoFocus
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <span id="name-error" className="field-error">
              {errors.name}
            </span>
          )}
        </label>
        <div className="form-grid">
          <label className="field">
            الكمية <span className="required">*</span>
            <input
              name="quantity"
              type="number"
              inputMode="decimal"
              min="0.001"
              max="100000"
              step="0.001"
              defaultValue={item?.quantity ?? 1}
              required
              aria-invalid={!!errors.quantity}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
            />
            {errors.quantity && (
              <span id="quantity-error" className="field-error">
                {errors.quantity}
              </span>
            )}
          </label>
          <label className="field">
            الوحدة
            <select name="unit" defaultValue={item?.unit ?? 'حبة'}>
              {UNITS.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            التصنيف
            <select name="category" defaultValue={item?.category ?? 'produce'}>
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            مكان الحفظ
            <select name="location" defaultValue={item?.location ?? 'fridge'}>
              {Object.entries(LOCATIONS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          التاريخ على العبوة أو موعد تذكيرك <span className="optional">اختياري</span>
          <div className="date-field">
            <input
              type="date"
              name="date"
              min="1900-01-01"
              max="2100-12-31"
              defaultValue={item?.date ?? ''}
              aria-invalid={!!errors.date}
              aria-describedby="date-hint"
            />
            <CalendarDays size={18} />
          </div>
          <span id="date-hint" className={errors.date ? 'field-error' : 'field-hint'}>
            {errors.date || 'اتبع تعليمات العبوة؛ هذا التاريخ للتنظيم وليس تقييماً لسلامة الطعام.'}
          </span>
        </label>
        <label className="field">
          ملاحظة <span className="optional">اختياري</span>
          <textarea
            name="notes"
            rows={2}
            placeholder="أي تفصيل يساعدك تتذكر…"
            maxLength={300}
            defaultValue={item?.notes ?? ''}
          />
        </label>
        {Object.keys(errors).length > 0 && (
          <p className="form-error" role="alert">
            {errors.submit || 'راجع الحقول الموضّحة أعلاه.'}
          </p>
        )}
        <div className="modal-actions">
          <button className="button primary" type="submit">
            <Check size={18} />
            {item ? 'حفظ التعديلات' : 'إضافة للمخزن'}
          </button>
          <button type="button" className="button secondary" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ConsumeForm({
  item,
  onConsume,
  onClose,
}: {
  item: Item
  onConsume: (quantity: number, kind: 'used' | 'discarded', toShopping: boolean) => boolean
  onClose: () => void
}) {
  const [amount, setAmount] = useState(String(item.quantity))
  const [kind, setKind] = useState<'used' | 'discarded'>('used')
  const [toShopping, setToShopping] = useState(true)
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const quantity = Number(amount)
    if (
      !(quantity > 0) ||
      quantity > item.quantity ||
      !itemInputSchema.shape.quantity.safeParse(quantity).success
    ) {
      setError('أدخل كمية صحيحة لا تتجاوز الموجود، حتى ثلاث منازل عشرية.')
      return
    }
    if (onConsume(quantity, kind, toShopping)) onClose()
    else setError('تعذّر تسجيل العملية. أعد فتح المادة وتحقق من الكمية ومساحة قائمة التسوق.')
  }
  return (
    <Modal
      title={`سجّل استخدام ${item.name}`}
      subtitle={`الموجود: ${formatNumber(item.quantity)} ${item.unit}`}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="item-form">
        <fieldset className="choice-group">
          <legend>ماذا حدث للمادة؟</legend>
          <label className={kind === 'used' ? 'choice selected' : 'choice'}>
            <input
              type="radio"
              name="kind"
              value="used"
              checked={kind === 'used'}
              onChange={() => setKind('used')}
            />
            استخدمتها
          </label>
          <label className={kind === 'discarded' ? 'choice selected' : 'choice'}>
            <input
              type="radio"
              name="kind"
              value="discarded"
              checked={kind === 'discarded'}
              onChange={() => setKind('discarded')}
            />
            تخلّصت منها
          </label>
        </fieldset>
        <label className="field">
          الكمية ({item.unit})
          <input
            type="number"
            inputMode="decimal"
            min="0.001"
            max={item.quantity}
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'consume-error' : undefined}
          />
          {error && (
            <span id="consume-error" role="alert" className="field-error">
              {error}
            </span>
          )}
        </label>
        {Number(amount) === item.quantity && (
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={toShopping}
              onChange={(e) => setToShopping(e.target.checked)}
            />
            <span>
              أضفها لقائمة التسوق عند نفادها <small>بكمية 1 {item.unit}؛ تقدر تعدّلها لاحقاً.</small>
            </span>
          </label>
        )}
        <p className="inline-note">
          <Info size={17} />
          سيُخصم المقدار من المخزن ويُضاف إلى سجلّك.
        </p>
        <div className="modal-actions">
          <button type="submit" className="button primary">
            <Check size={18} />
            تسجيل {kind === 'used' ? 'الاستخدام' : 'التخلّص'}
          </button>
          <button type="button" className="button secondary" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ShoppingForm({
  item,
  onSave,
  onClose,
}: {
  item?: ShoppingItem
  onSave: (input: ShoppingInput, id?: string) => boolean
  onClose?: () => void
}) {
  const [error, setError] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    const result = shoppingInputSchema.safeParse({
      name: fields.get('name'),
      quantity: Number(fields.get('quantity')),
      unit: fields.get('unit'),
    })
    if (!result.success) {
      setError('اكتب اسماً حتى 80 حرفاً وكمية أكبر من صفر وحتى 100000، بثلاث منازل عشرية كحد أقصى.')
      return
    }
    if (onSave(result.data, item?.id)) {
      setError('')
      if (onClose) onClose()
      else {
        form.reset()
        form.querySelector('input')?.focus()
      }
    } else {
      setError('تعذّر الحفظ. تحقق من الكمية وعدد المواد، ثم أعد فتح النموذج.')
    }
  }
  const form = (
    <form className="shopping-form" onSubmit={submit} noValidate>
      <div className="shopping-fields">
        <label className="field shopping-name">
          ماذا تحتاج؟
          <input
            name="name"
            maxLength={80}
            placeholder="مثلاً: زيت زيتون"
            defaultValue={item?.name}
            required
            autoFocus={!!item}
            aria-describedby={error ? 'shopping-error' : undefined}
          />
        </label>
        <label className="field shopping-quantity">
          الكمية
          <input
            name="quantity"
            type="number"
            inputMode="decimal"
            min="0.001"
            max="100000"
            step="0.001"
            defaultValue={item?.quantity ?? 1}
            required
          />
        </label>
        <label className="field shopping-unit">
          الوحدة
          <select name="unit" defaultValue={item?.unit ?? 'حبة'}>
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="button primary">
          <Plus size={18} />
          {item ? 'حفظ التعديل' : 'إضافة'}
        </button>
      </div>
      {error && (
        <p className="field-error" id="shopping-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
  return item && onClose ? (
    <Modal title="تعديل مادة التسوق" onClose={onClose}>
      {form}
    </Modal>
  ) : (
    form
  )
}
