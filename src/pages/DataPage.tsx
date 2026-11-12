import { useRef } from 'react'
import { Download, Info, LoaderCircle, RotateCcw, ShieldCheck, Upload } from 'lucide-react'
import { downloadJson, type Loaded } from '../lib/storage'

export function DataPage({
  stored,
  today,
  importing,
  onBackup,
  onImport,
  onReset,
}: {
  stored: Loaded
  today: string
  importing: boolean
  onBackup: () => void
  onImport: (file?: File) => Promise<void>
  onReset: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { corrupt } = stored
  return (
    <section className="data-section" aria-labelledby="data-title">
      <div className="privacy-hero">
        <span className="privacy-emblem">
          <ShieldCheck size={34} />
        </span>
        <div>
          <span className="eyebrow">بيتك له خصوصيته</span>
          <h2 id="data-title">بياناتك عندك. القرار إلك.</h2>
          <p>
            زاد يحفظ مخزنك في هذا المتصفح فقط. بلا تسجيل دخول، بلا تتبّع، وبلا إرسال بيانات لخادم.
          </p>
        </div>
      </div>
      {corrupt && (
        <div className="recovery-card">
          <Info size={24} />
          <div>
            <h3>بيانات محفوظة تحتاج مراجعة</h3>
            <p>حافظنا على الأصل ولم نستبدله. نزّل الملف قبل استعادة نسخة أو البدء من جديد.</p>
            <button
              className="button secondary"
              onClick={() => downloadJson(stored.raw || '', `zaad-recovery-${today}.json`)}
            >
              <Download size={17} />
              تنزيل البيانات الأصلية
            </button>
          </div>
        </div>
      )}
      <div className="data-grid">
        <article className="data-card">
          <span className="data-icon">
            <Download size={24} />
          </span>
          <h3>نسخة تطمّن بالك</h3>
          <p>نزّل ملف JSON فيه مخزنك وقائمة تسوقك وسجلّك. تقدر تستعيده في متصفح آخر.</p>
          <button className="button primary" onClick={onBackup} disabled={corrupt}>
            <Download size={17} />
            تنزيل نسخة احتياطية
          </button>
        </article>
        <article className="data-card">
          <span className="data-icon apricot">
            <Upload size={24} />
          </span>
          <h3>ارجع لمخزنك</h3>
          <p>اختر نسخة من زاد. سنفحصها ونعرض محتواها بالأرقام قبل استبدال بياناتك الحالية.</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            aria-label="اختيار نسخة احتياطية"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              void onImport(file)
            }}
          />
          <button
            className="button secondary"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? <LoaderCircle size={17} className="spin" /> : <Upload size={17} />}
            {importing ? 'جاري فحص النسخة…' : 'استعادة من ملف'}
          </button>
          <span className="field-hint">JSON فقط · حتى 1 ميغابايت · 500 سجل لكل قائمة</span>
        </article>
      </div>
      <div className="privacy-details">
        <h3>
          <Info size={20} />
          تعرف على طريقة الحفظ
        </h3>
        <ul>
          <li>
            الحفظ مرتبط بالمتصفح والجهاز. مسح بيانات الموقع أو استخدام نافذة خاصة قد يفقدك البيانات.
          </li>
          <li>النسخ الاحتياطية تحتوي ما كتبته، بما فيه الملاحظات. احتفظ بها في مكان خاص.</li>
          <li>التواريخ تذكيرات تنظيمية حسب إدخالك، وليست حكماً على صلاحية الطعام.</li>
          <li>
            التغييرات في نافذة أخرى من المتصفح نفسه تظهر تلقائياً. يُفضّل التعديل من نافذة واحدة في كل
            مرة.
          </li>
          <li>الحد الأقصى 500 مادة و500 مادة تسوق؛ يحتفظ السجل بآخر 500 عملية.</li>
        </ul>
      </div>
      <div className="reset-card">
        <div>
          <h3>بداية جديدة</h3>
          <p>امسح المخزن وقائمة التسوق والسجل من هذا المتصفح. نزّل نسخة أولاً إذا احتجتها.</p>
        </div>
        <button className="button danger-outline" onClick={onReset}>
          <RotateCcw size={17} />
          مسح كل البيانات
        </button>
      </div>
    </section>
  )
}
