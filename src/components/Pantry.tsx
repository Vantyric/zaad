import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  FilterX,
  Pencil,
  Plus,
  Search,
  Snowflake,
  Trash2,
  Refrigerator,
  PackageOpen,
  Sprout,
} from 'lucide-react'
import {
  CATEGORIES,
  LOCATIONS,
  filterItems,
  formatDate,
  formatNumber,
  statusLabel,
  statusOf,
  type Filters,
  type Item,
} from '../lib/model'
import { FoodArt, PantryArt } from './Art'

const locationIcons = { fridge: Refrigerator, freezer: Snowflake, pantry: PackageOpen }
const categoryIcons = { produce: '✳', dairy: '◒', grains: '◌', protein: '◈', other: '✦' }

export function Hero({
  onAdd,
  onUseFirst,
  hasItems,
}: {
  onAdd: () => void
  onUseFirst: () => void
  hasItems: boolean
}) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="hero-label">
          <span />
          لأن كل نعمة تستاهل
        </span>
        <h2 id="hero-title">
          خير بيتك،
          <br />
          <em>خلّه بوقته.</em>
        </h2>
        <p>
          اعرف الموجود، استخدمه بوقته،
          <br className="desktop-break" /> وتسوق على قدر حاجتك.
        </p>
        <div className="hero-actions">
          <button className="button cream" onClick={onAdd}>
            <Plus size={18} />
            {hasItems ? 'أضف مادة جديدة' : 'أضف أول مادة'}
          </button>
          <button className="text-button hero-link" onClick={onUseFirst}>
            ماذا أستخدم أولاً؟ <ArrowLeft size={17} />
          </button>
        </div>
      </div>
      <PantryArt />
      <span className="hero-caption">قليل من الترتيب، كثير من الخير.</span>
    </section>
  )
}

export function ItemCard({
  item,
  today,
  onEdit,
  onConsume,
  onDelete,
}: {
  item: Item
  today: string
  onEdit: (item: Item) => void
  onConsume: (item: Item) => void
  onDelete: (item: Item) => void
}) {
  const status = statusOf(item, today)
  const LocationIcon = locationIcons[item.location]
  return (
    <article className={`item-card category-${item.category}`} aria-label={item.name}>
      <div className="card-art">
        <span className="location-tag">
          <LocationIcon size={13} />
          {LOCATIONS[item.location]}
        </span>
        <FoodArt category={item.category} name={item.name} />
        <span className="art-category">{CATEGORIES[item.category]}</span>
      </div>
      <div className="card-content">
        <div className="card-heading">
          <h3>{item.name}</h3>
          <span className="quantity">
            {formatNumber(item.quantity)} <small>{item.unit}</small>
          </span>
        </div>
        <div className={`date-status ${status}`}>
          <span className="status-dot" />
          <span>{statusLabel(item, today)}</span>
          {item.date && <time dateTime={item.date}>{formatDate(item.date)}</time>}
        </div>
        {item.notes && (
          <p className="item-note" title={item.notes}>
            {item.notes}
          </p>
        )}
        <div className="card-actions">
          <button className="use-button" onClick={() => onConsume(item)}>
            <Check size={16} />
            سجّل الاستخدام
          </button>
          <div>
            <button
              className="icon-button"
              aria-label={`تعديل ${item.name}`}
              title="تعديل"
              onClick={() => onEdit(item)}
            >
              <Pencil size={16} />
            </button>
            <button
              className="icon-button delete-button"
              aria-label={`حذف ${item.name}`}
              title="حذف"
              onClick={() => onDelete(item)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function Pantry({
  items,
  today,
  filters,
  setFilters,
  onAdd,
  onDemo,
  onEdit,
  onConsume,
  onDelete,
  priority = false,
}: {
  items: Item[]
  today: string
  filters: Filters
  setFilters: (filters: Filters) => void
  onAdd: () => void
  onDemo: () => void
  onEdit: (item: Item) => void
  onConsume: (item: Item) => void
  onDelete: (item: Item) => void
  priority?: boolean
}) {
  const source = priority
    ? items.filter((item) => ['soon', 'expired'].includes(statusOf(item, today)))
    : items
  const visible = filterItems(source, filters, today)
  const change = (key: keyof Filters, value: string) => setFilters({ ...filters, [key]: value })
  const hasFilters =
    filters.query !== '' ||
    filters.category !== 'all' ||
    filters.location !== 'all' ||
    filters.status !== 'all'
  return (
    <section className="pantry-section" aria-labelledby="pantry-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {priority ? 'ترتيب صغير، فرق كبير' : 'كل الموجود بمكان واحد'}
          </span>
          <h2 id="pantry-title">
            {priority ? 'استخدمه أولاً' : 'مخزن البيت'}{' '}
            <span className="count-badge">{formatNumber(source.length)}</span>
          </h2>
        </div>
        <button className="button primary" onClick={onAdd}>
          <Plus size={18} />
          إضافة مادة
        </button>
      </div>
      {priority && (
        <p className="priority-explainer">
          <CalendarDays size={18} />
          المواد التي يحين تاريخها خلال 3 أيام أو تجاوزته. راجع التاريخ وتعليمات العبوة قبل
          الاستخدام.
        </p>
      )}
      <div className="inventory-toolbar">
        <label className="search-field">
          <Search size={19} />
          <input
            type="search"
            placeholder="ابحث عن مادة في مخزنك…"
            aria-label="البحث في المخزن"
            value={filters.query}
            onChange={(e) => change('query', e.target.value)}
          />
        </label>
        <label className="sort-field">
          <span>الترتيب</span>
          <select
            aria-label="ترتيب المواد"
            value={filters.sort}
            onChange={(e) => change('sort', e.target.value)}
          >
            <option value="date">الأقرب موعداً</option>
            <option value="name">الاسم أبجدياً</option>
            <option value="newest">الأحدث إضافة</option>
          </select>
        </label>
      </div>
      <div className="category-filters" aria-label="تصفية حسب التصنيف">
        <button
          className={filters.category === 'all' ? 'filter-chip active' : 'filter-chip'}
          aria-pressed={filters.category === 'all'}
          onClick={() => change('category', 'all')}
        >
          كل المواد
        </button>
        {Object.entries(CATEGORIES).map(([value, label]) => (
          <button
            key={value}
            className={filters.category === value ? 'filter-chip active' : 'filter-chip'}
            aria-pressed={filters.category === value}
            onClick={() => change('category', value)}
          >
            <span aria-hidden="true" className="chip-symbol">
              {categoryIcons[value as keyof typeof CATEGORIES]}
            </span>
            {label}
          </button>
        ))}
      </div>
      <div className="sub-filters">
        <div>
          <label>
            مكان الحفظ
            <select
              aria-label="تصفية مكان الحفظ"
              value={filters.location}
              onChange={(e) => change('location', e.target.value)}
            >
              <option value="all">كل الأماكن</option>
              {Object.entries(LOCATIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            التاريخ
            <select
              aria-label="تصفية حسب التاريخ"
              value={filters.status}
              onChange={(e) => change('status', e.target.value)}
            >
              <option value="all">كل المواعيد</option>
              <option value="soon">خلال 3 أيام</option>
              <option value="expired">تجاوز التاريخ</option>
              <option value="later">بعد 3 أيام</option>
              <option value="undated">بدون تاريخ</option>
            </select>
          </label>
        </div>
        <span className="results-count" role="status">
          {formatNumber(visible.length)} مادة{hasFilters ? ' تطابق بحثك' : ''}
        </span>
      </div>
      {visible.length ? (
        <div className="item-grid">
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              today={today}
              onEdit={onEdit}
              onConsume={onConsume}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-illustration">
            {hasFilters ? (
              <Search size={34} />
            ) : priority ? (
              <Clock3 size={36} />
            ) : (
              <Sprout size={38} />
            )}
          </div>
          <h3>
            {hasFilters
              ? 'ما لقينا مادة بهالمواصفات'
              : priority
                ? 'ماكو مواعيد قريبة حالياً'
                : 'كل خير يبدأ بمادة'}
          </h3>
          <p>
            {hasFilters
              ? 'جرّب اسماً آخر، أو وسّع خيارات التصفية.'
              : priority
                ? 'المواد التي يقترب تاريخها ستظهر هنا تلقائياً.'
                : 'أضف الموجود في ثلاجتك أو على الرف، وخلّ الباقي علينا.'}
          </p>
          <div className="empty-actions">
            {hasFilters ? (
              <button
                className="button secondary"
                onClick={() =>
                  setFilters({
                    query: '',
                    category: 'all',
                    location: 'all',
                    status: 'all',
                    sort: 'date',
                  })
                }
              >
                <FilterX size={17} />
                مسح التصفية
              </button>
            ) : (
              <>
                <button className="button primary" onClick={onAdd}>
                  <Plus size={17} />
                  إضافة مادة
                </button>
                {!priority && (
                  <button className="text-button" onClick={onDemo}>
                    جرّب مخزناً توضيحياً <ArrowLeft size={16} />
                  </button>
                )}
              </>
            )}
          </div>
          {!hasFilters && !priority && (
            <small className="demo-caption">البيانات التوضيحية خيالية وتُضاف فقط باختيارك.</small>
          )}
        </div>
      )}
    </section>
  )
}
