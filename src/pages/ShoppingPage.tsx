import {
  ArrowLeft,
  Check,
  CheckCheck,
  Pencil,
  Printer,
  ShoppingBasket,
  Sprout,
  Trash2,
} from 'lucide-react'
import { ShoppingForm } from '../components/Forms'
import { formatNumber, type Data } from '../lib/model'
import type { Commit, Navigate, OpenDialog } from '../lib/ui'

export function ShoppingPage({
  data,
  onCommit,
  onDialog,
  onNavigate,
}: {
  data: Pick<Data, 'shopping'>
  onCommit: Commit
  onDialog: OpenDialog
  onNavigate: Navigate
}) {
  const shoppingLeft = data.shopping.filter((item) => !item.checked).length
  const checkedCount = data.shopping.length - shoppingLeft
  return (
    <section className="shopping-section" aria-labelledby="shopping-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">تسوّق على قدر حاجتك</span>
          <h2 id="shopping-title">قائمة مرتّبة، مشوار أخف</h2>
        </div>
        <button
          className="button secondary print-button"
          onClick={() => window.print()}
          disabled={!data.shopping.length}
        >
          <Printer size={18} />
          طباعة القائمة
        </button>
      </div>
      <p className="section-description">
        دوّن الناقص، وعلّم ما اشتريته. الشراء لا يضيف المادة للمخزن تلقائياً؛ أضفها مع تاريخها الجديد.
      </p>
      <ShoppingForm
        onSave={(input, id) =>
          onCommit({ type: 'saveShopping', input, id }, 'تم حفظ المادة في قائمة التسوق.')
        }
      />
      <div className="shopping-summary">
        <span>
          <strong>{shoppingLeft}</strong> متبقية للشراء <span className="summary-dot">·</span>{' '}
          <strong>{checkedCount}</strong> تم شراؤها
        </span>
        {checkedCount > 0 && (
          <button
            className="text-button muted-button"
            onClick={() => onDialog({ type: 'clearChecked' })}
          >
            <CheckCheck size={17} />
            مسح المشتريات المكتملة
          </button>
        )}
      </div>
      {data.shopping.length ? (
        <ul className="shopping-list">
          {[...data.shopping]
            .sort((a, b) => Number(a.checked) - Number(b.checked))
            .map((item) => (
              <li key={item.id} className={item.checked ? 'shopping-row checked' : 'shopping-row'}>
                <label className="shopping-check">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() =>
                      onCommit(
                        { type: 'toggleShopping', id: item.id },
                        item.checked
                          ? 'أُعيدت المادة إلى قائمة الشراء.'
                          : 'تم تعليم المادة كمشتراة.',
                      )
                    }
                  />
                  <span className="custom-check" aria-hidden="true">
                    <Check size={16} />
                  </span>
                  <span>
                    {item.name}
                    <small>
                      {formatNumber(item.quantity)} {item.unit}
                    </small>
                  </span>
                </label>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`تعديل شراء ${item.name}`}
                    onClick={() => onDialog({ type: 'shopping', item })}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button delete-button"
                    aria-label={`حذف شراء ${item.name}`}
                    onClick={() =>
                      onCommit(
                        { type: 'deleteShopping', id: item.id },
                        'حُذفت المادة من قائمة التسوق.',
                      )
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      ) : (
        <div className="empty-state compact">
          <div className="empty-illustration">
            <ShoppingBasket size={36} />
          </div>
          <h3>مشوارك القادم يبدأ هنا</h3>
          <p>
            أضف ما ينقصك من النموذج أعلاه.
            <br />
            المواد المتكررة بنفس الوحدة تُجمع تلقائياً.
          </p>
        </div>
      )}
      <div className="shopping-tip">
        <Sprout size={22} />
        <p>
          <strong>قبل ما تطلع للسوق…</strong> نظرة على المخزن قد تختصر عليك القائمة.
        </p>
        <button className="text-button" onClick={() => onNavigate('pantry')}>
          افتح المخزن <ArrowLeft size={17} />
        </button>
      </div>
    </section>
  )
}
