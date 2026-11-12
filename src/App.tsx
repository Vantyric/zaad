import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpLeft,
  Clock3,
  Download,
  Heart,
  History,
  Info,
  Leaf,
  PackageOpen,
  ShieldCheck,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Sprout,
} from 'lucide-react'
import { BrandMark } from './components/Art'
import { ConsumeForm, ItemForm, ShoppingForm } from './components/Forms'
import { ConfirmModal, Modal } from './components/Modal'
import { Hero, Pantry } from './components/Pantry'
import { ShoppingPage } from './pages/ShoppingPage'
import { ActivityPage } from './pages/ActivityPage'
import { DataPage } from './pages/DataPage'
import { Notice } from './components/Notice'
import type { Page, Dialog } from './lib/ui'
import {
  demoData,
  emptyData,
  formatNumber,
  localDate,
  MAX_BACKUP_BYTES,
  parseBackup,
  reduceData,
  statusOf,
  STORAGE_KEY,
  type Action,
  type Filters,
  type Item,
} from './lib/model'
import { downloadJson, loadData, saveData } from './lib/storage'

const defaults: Filters = {
  query: '',
  category: 'all',
  location: 'all',
  status: 'all',
  sort: 'date',
}
const pages = [
  { id: 'pantry', label: 'مخزن البيت', short: 'المخزن', icon: PackageOpen },
  { id: 'priority', label: 'استخدمه أولاً', short: 'الأولوية', icon: Clock3 },
  { id: 'shopping', label: 'قائمة التسوق', short: 'التسوق', icon: ShoppingBasket },
  { id: 'activity', label: 'سجل الاستخدام', short: 'السجل', icon: History },
  { id: 'data', label: 'بياناتي والخصوصية', short: 'بياناتي', icon: SlidersHorizontal },
] as const

function initialPage(): Page {
  const hash = window.location.hash.slice(1)
  return pages.some((page) => page.id === hash) ? (hash as Page) : 'pantry'
}

export default function App() {
  const [stored, setStored] = useState(() => loadData())
  const [page, setPage] = useState<Page>(initialPage)
  const [filters, setFilters] = useState<Filters>(defaults)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const closeNotice = useCallback(() => setNotice(null), [])
  const [importing, setImporting] = useState(false)
  const [today, setToday] = useState(localDate)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { data, error: storageError, corrupt } = stored
  const currentPage = corrupt ? 'data' : page
  const soon = data.items.filter((item) => statusOf(item, today) === 'soon').length
  const expired = data.items.filter((item) => statusOf(item, today) === 'expired').length
  const used = data.activity.filter((event) => event.kind === 'used').length
  const shoppingLeft = data.shopping.filter((item) => !item.checked).length
  const title = pages.find((item) => item.id === currentPage)!.label

  useEffect(() => {
    const onHash = () => {
      if (!pages.some((page) => page.id === window.location.hash.slice(1))) return
      setPage(initialPage())
      setFilters(defaults)
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setStored(loadData())
        setDialog(null)
        setNotice({ text: 'تم تحديث البيانات من نافذة أخرى.', error: false })
      }
    }
    const onFocus = () => setToday(localDate())
    window.addEventListener('hashchange', onHash)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(onFocus, 60_000)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    document.title = `${title} — زاد`
  }, [title])

  function go(next: Page) {
    setPage(next)
    setFilters(defaults)
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
    headingRef.current?.focus({ preventScroll: true })
  }
  function commit(action: Action, message = 'تم حفظ التغيير.'): boolean {
    if (corrupt && action.type !== 'replace') return false
    try {
      const next = reduceData(data, action)
      const error = saveData(next)
      setStored({ data: next, error, corrupt: false, raw: null })
      setNotice({
        text: error ? 'تم التغيير في الجلسة. نزّل نسخة احتياطية لحفظه.' : message,
        error: !!error,
      })
      return true
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : 'تعذّر تنفيذ الإجراء. حاول مجدداً.',
        error: true,
      })
      return false
    }
  }
  function backup() {
    downloadJson(JSON.stringify(data, null, 2), `zaad-backup-${today}.json`)
    setNotice({ text: 'تم تجهيز النسخة للتحميل. احتفظ بها في مكان خاص.', error: false })
  }
  async function importFile(file?: File) {
    if (!file) return
    setImporting(true)
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('حجم الملف أكبر من 1 ميغابايت.')
      const incoming = parseBackup(await file.text())
      setDialog({ type: 'import', data: incoming })
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : 'تعذّرت قراءة الملف.',
        error: true,
      })
    } finally {
      setImporting(false)
    }
  }
  const itemCallbacks = {
    onAdd: () => setDialog({ type: 'item' }),
    onDemo: () =>
      commit(
        { type: 'replace', data: { ...data, items: demoData().items } },
        'أُضيفت 6 مواد خيالية للتجربة. يمكنك تعديلها أو مسحها من بياناتي.',
      ),
    onEdit: (item: Item) => setDialog({ type: 'item', item }),
    onConsume: (item: Item) => setDialog({ type: 'consume', item }),
    onDelete: (item: Item) => setDialog({ type: 'delete', item }),
  }
  const checkedCount = data.shopping.length - shoppingLeft

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main-content')
          main?.focus()
          main?.scrollIntoView({ block: 'start', behavior: 'instant' })
        }}
      >
        انتقل إلى المحتوى
      </a>
      <aside className="sidebar">
        <button className="brand" onClick={() => go('pantry')} aria-label="زاد، مخزن البيت">
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span>
            <strong>
              زاد<span className="brand-dot">.</span>
            </strong>
            <small>خير بيتك، بوقته</small>
          </span>
        </button>
        <span className="nav-label">مساحتك اليومية</span>
        <nav aria-label="التنقل الرئيسي">
          {pages.map(({ id, label, short, icon: Icon }) => (
            <button
              key={id}
              className={currentPage === id ? 'nav-item selected' : 'nav-item'}
              onClick={() => go(id)}
              disabled={corrupt && id !== 'data'}
              aria-current={currentPage === id ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="nav-desktop-label">{label}</span>
              <span className="nav-mobile-label">{short}</span>
              {id === 'priority' && soon + expired > 0 && (
                <span className="nav-count">{soon + expired}</span>
              )}
              {id === 'shopping' && shoppingLeft > 0 && (
                <span className="nav-count shopping-count">{shoppingLeft}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-manifesto">
            <Sprout size={25} />
            <p>
              مشتريات أوعى.
              <br />
              <strong>هدر أقل.</strong>
            </p>
            <span>الخير يبدأ من بيتك.</span>
          </div>
          <button className="privacy-link" onClick={() => go('data')}>
            <ShieldCheck size={17} />
            <span>{storageError ? 'تحقق من الحفظ' : 'بياناتك تبقى عندك'}</span>
            <ArrowUpLeft size={15} />
          </button>
          <span className="version-label">صُنع بعناية، لمائدة أفضل · 1.0.1</span>
        </div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        <header className="topbar">
          <div>
            <span className="greeting">
              {currentPage === 'pantry' ? 'أهلاً بترتيبٍ يريح بالك' : 'خطوة صغيرة لبيت أكثر ترتيباً'}
            </span>
            <h1 ref={headingRef} tabIndex={-1}>
              {currentPage === 'pantry' ? 'كل نعمة إلها مكان' : title}
              <span className="heading-spark">✳</span>
            </h1>
          </div>
          <div className="topbar-meta">
            <span className="local-badge">
              <span />
              مساحتك الخاصة
            </span>
            <time dateTime={today}>
              {new Intl.DateTimeFormat('ar-IQ', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                numberingSystem: 'latn',
              }).format(new Date(`${today}T12:00:00`))}
            </time>
          </div>
        </header>
        {storageError && (
          <div className="storage-alert" role="alert">
            <Info size={21} />
            <p>{storageError}</p>
            <button className="text-button" onClick={() => go('data')}>
              إدارة البيانات <ArrowLeft size={17} />
            </button>
          </div>
        )}
        {currentPage === 'pantry' && (
          <>
            <Hero
              hasItems={data.items.length > 0}
              onAdd={itemCallbacks.onAdd}
              onUseFirst={() => go('priority')}
            />
            <div className="stats-grid" aria-label="ملخص مخزنك">
              <div className="stat-card">
                <span className="stat-icon sage">
                  <PackageOpen size={22} />
                </span>
                <div>
                  <span>مواد في المخزن</span>
                  <strong>
                    {formatNumber(data.items.length)}
                    <small>مادة</small>
                  </strong>
                </div>
              </div>
              <button className="stat-card stat-button" onClick={() => go('priority')}>
                <span className="stat-icon peach">
                  <Clock3 size={22} />
                </span>
                <div>
                  <span>موعدها خلال 3 أيام</span>
                  <strong>
                    {formatNumber(soon)}
                    <small>مادة</small>
                  </strong>
                </div>
                <ArrowUpLeft size={18} className="stat-arrow" />
              </button>
              <div className="stat-card">
                <span className="stat-icon cream-icon">
                  <Leaf size={22} />
                </span>
                <div>
                  <span>استخدامات في السجل</span>
                  <strong>
                    {formatNumber(used)}
                    <small>مرة</small>
                  </strong>
                </div>
              </div>
            </div>
            {soon + expired > 0 && (
              <div className="priority-banner">
                <span className="banner-icon">
                  <Sparkles size={21} />
                </span>
                <p>
                  <strong>لفتة لمخزنك</strong>
                  <span>
                    {soon > 0 ? `${formatNumber(soon)} مادة موعدها قريب` : ''}
                    {soon && expired ? '، و' : ''}
                    {expired > 0 ? `${formatNumber(expired)} تجاوزت التاريخ المحدد` : ''}. نظرة
                    سريعة تساعدك ترتّب أولوياتك.
                  </span>
                </p>
                <button className="text-button" onClick={() => go('priority')}>
                  شوف المواد <ArrowLeft size={17} />
                </button>
              </div>
            )}
            <Pantry
              items={data.items}
              today={today}
              filters={filters}
              setFilters={setFilters}
              {...itemCallbacks}
            />
          </>
        )}
        {currentPage === 'priority' && (
          <Pantry
            priority
            items={data.items}
            today={today}
            filters={filters}
            setFilters={setFilters}
            {...itemCallbacks}
          />
        )}
        {currentPage === 'shopping' && (
          <ShoppingPage data={data} onCommit={commit} onDialog={setDialog} onNavigate={go} />
        )}
        {currentPage === 'activity' && (
          <ActivityPage data={data} onCommit={commit} onNavigate={go} />
        )}
        {currentPage === 'data' && (
          <DataPage
            stored={stored}
            today={today}
            importing={importing}
            onBackup={backup}
            onImport={importFile}
            onReset={() => setDialog({ type: 'reset' })}
          />
        )}
        <footer className="app-footer">
          <span>
            <BrandMark />
            زاد <span className="footer-dot">·</span> ترتيب بسيط، أثر طيّب.
          </span>
          <span>
            صُنع لمائدة فيها خير <Heart size={13} />
          </span>
        </footer>
      </main>
      {notice && <Notice notice={notice} onClose={closeNotice} />}
      {dialog?.type === 'item' && (
        <ItemForm
          item={dialog.item}
          onClose={() => setDialog(null)}
          onSave={(input, id) =>
            commit(
              { type: 'saveItem', input, id },
              id ? 'تم تحديث المادة.' : 'أُضيفت المادة للمخزن.',
            )
          }
        />
      )}
      {dialog?.type === 'consume' && (
        <ConsumeForm
          item={dialog.item}
          onClose={() => setDialog(null)}
          onConsume={(quantity, kind, toShopping) =>
            commit(
              { type: 'consume', id: dialog.item.id, quantity, kind, toShopping },
              'تم تسجيل العملية وتحديث المخزن.',
            )
          }
        />
      )}
      {dialog?.type === 'delete' && (
        <ConfirmModal
          title={`حذف ${dialog.item.name}؟`}
          confirm="حذف المادة"
          danger
          onClose={() => setDialog(null)}
          onConfirm={() => {
            if (commit({ type: 'deleteItem', id: dialog.item.id }, 'حُذفت المادة.')) setDialog(null)
          }}
        >
          <p>
            ستُحذف المادة من المخزن. سجل الاستخدام السابق يبقى محفوظاً. لتسجيل استخدام أو تخلّص، اختر
            «سجّل الاستخدام» بدلاً من الحذف.
          </p>
        </ConfirmModal>
      )}
      {dialog?.type === 'shopping' && (
        <ShoppingForm
          item={dialog.item}
          onClose={() => setDialog(null)}
          onSave={(input, id) =>
            commit({ type: 'saveShopping', input, id }, 'تم تعديل مادة التسوق.')
          }
        />
      )}
      {dialog?.type === 'clearChecked' && (
        <ConfirmModal
          title="مسح المشتريات المكتملة؟"
          confirm="مسح المكتملة"
          onClose={() => setDialog(null)}
          onConfirm={() => {
            commit({ type: 'clearChecked' }, 'مُسحت المشتريات المكتملة.')
            setDialog(null)
          }}
        >
          <p>ستُحذف {checkedCount} مادة تم شراؤها. تبقى بقية قائمة التسوق.</p>
        </ConfirmModal>
      )}
      {dialog?.type === 'reset' && (
        <ConfirmModal
          title="تمسح كل بيانات زاد؟"
          confirm="نعم، مسح كل البيانات"
          danger
          onClose={() => setDialog(null)}
          onConfirm={() => {
            commit({ type: 'replace', data: emptyData() }, 'تم مسح البيانات. تقدر تبدأ من جديد.')
            setDialog(null)
          }}
        >
          <p>
            سيُمسح المخزن وقائمة التسوق والسجل من هذا المتصفح. لا يمكن التراجع إلا باستعادة نسخة
            احتياطية سابقة.
          </p>
          {!corrupt && (
            <button className="text-button" onClick={backup}>
              <Download size={17} />
              تنزيل نسخة قبل المسح
            </button>
          )}
        </ConfirmModal>
      )}
      {dialog?.type === 'import' && (
        <Modal
          title="راجع النسخة قبل الاستعادة"
          subtitle="تم فحص بنية الملف وصحة البيانات."
          onClose={() => setDialog(null)}
        >
          <div className="import-summary">
            <div>
              <strong>{dialog.data.items.length}</strong>
              <span>مادة بالمخزن</span>
            </div>
            <div>
              <strong>{dialog.data.shopping.length}</strong>
              <span>مادة تسوق</span>
            </div>
            <div>
              <strong>{dialog.data.activity.length}</strong>
              <span>عملية بالسجل</span>
            </div>
          </div>
          <p className="import-warning">
            الاستعادة تستبدل جميع بياناتك الحالية بمحتوى هذا الملف. نزّل نسخة من الموجود أولاً إذا
            أردت الاحتفاظ به.
          </p>
          {!corrupt && (
            <button className="text-button backup-before-import" onClick={backup}>
              <Download size={17} />
              تنزيل نسخة من بياناتي الحالية
            </button>
          )}
          <div className="modal-actions">
            <button
              className="button primary"
              onClick={() => {
                if (commit({ type: 'replace', data: dialog.data }, 'تمت استعادة النسخة بنجاح.'))
                  setDialog(null)
              }}
            >
              استبدال البيانات بهذه النسخة
            </button>
            <button className="button secondary" onClick={() => setDialog(null)}>
              إلغاء
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
