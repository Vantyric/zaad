import { ArrowLeft, History, Leaf, Plus, Trash2 } from 'lucide-react'
import { formatDate, formatNumber, localDate, type Data } from '../lib/model'
import type { Commit, Navigate } from '../lib/ui'

const timeFormatter = new Intl.DateTimeFormat('ar-IQ', {
  hour: '2-digit',
  minute: '2-digit',
  numberingSystem: 'latn',
})

export function ActivityPage({
  data,
  onCommit,
  onNavigate,
}: {
  data: Pick<Data, 'activity'>
  onCommit: Commit
  onNavigate: Navigate
}) {
  return (
    <section aria-labelledby="activity-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">حكاية الموجود في بيتك</span>
          <h2 id="activity-title">كل استخدام، خطوة أحسن</h2>
        </div>
        <span className="section-count">
          آخر {formatNumber(data.activity.length)} عملية · حتى 500
        </span>
      </div>
      <p className="section-description">
        سجل حقيقي لما استخدمته أو تخلّصت منه. تبقى العمليات هنا حتى لو حذفت المادة من مخزنك.
      </p>
      {data.activity.length ? (
        <ul className="activity-list">
          {data.activity.map((event) => (
            <li key={event.id} className="activity-row">
              <span className={`activity-icon ${event.kind}`}>
                {event.kind === 'used' ? <Leaf size={21} /> : <Trash2 size={20} />}
              </span>
              <div className="activity-description">
                <strong>{event.name}</strong>
                <span>
                  {event.kind === 'used' ? 'استخدمت' : 'تخلّصت من'} {formatNumber(event.quantity)}{' '}
                  {event.unit}
                </span>
              </div>
              <time dateTime={event.at}>
                {formatDate(localDate(new Date(event.at)))}
                <small>{timeFormatter.format(new Date(event.at))}</small>
              </time>
              <button
                className="icon-button"
                aria-label={`إضافة ${event.name} للتسوق`}
                title="إضافة للتسوق"
                onClick={() =>
                  onCommit(
                    {
                      type: 'saveShopping',
                      input: { name: event.name, quantity: 1, unit: event.unit },
                    },
                    'أُضيفت المادة للتسوق بكمية 1.',
                  )
                }
              >
                <Plus size={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <div className="empty-illustration">
            <History size={36} />
          </div>
          <h3>لسّه ماكو استخدامات مسجّلة</h3>
          <p>
            اضغط «سجّل الاستخدام» على أي مادة في مخزنك.
            <br />
            ستظهر الكمية والتاريخ هنا.
          </p>
          <button className="button primary" onClick={() => onNavigate('pantry')}>
            افتح المخزن <ArrowLeft size={17} />
          </button>
        </div>
      )}
    </section>
  )
}
