import type { Category } from '../lib/model'

export function FoodArt({ category, name = '' }: { category: Category; name?: string }) {
  const carrot = /جزر/.test(name)
  const leaves = /خس|خيار|نعناع|بقدونس/.test(name)
  return (
    <svg viewBox="0 0 120 100" fill="none" aria-hidden="true" className="food-art">
      <ellipse cx="60" cy="85" rx="36" ry="6" fill="currentColor" opacity=".08" />
      {category === 'produce' &&
        (carrot ? (
          <>
            <path
              d="M73 31C96 42 65 76 32 86 27 89 34 64 45 42 52 27 61 23 73 31Z"
              fill="#e68a45"
            />
            <path
              d="M55 48l10 6M46 62l9 5M39 74l5 3"
              stroke="#c8662b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M72 32C65 5 81 4 78 26 90 6 108 20 80 36 102 29 100 49 78 37Z"
              fill="#699464"
            />
          </>
        ) : leaves ? (
          <>
            <path
              d="M58 81C29 82 16 66 28 51 15 32 32 20 44 28 47 8 73 9 78 28 95 21 108 41 94 54 108 68 85 87 58 81Z"
              fill="#8cad68"
            />
            <path
              d="M60 84V33m0 25L43 44m17 26l21-22"
              stroke="#e1e9bc"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <path
              d="M31 43C42 29 52 37 61 34 82 27 99 44 96 62 94 82 72 89 54 85 30 82 21 61 31 43Z"
              fill="#dc7961"
            />
            <path d="M61 43l-17-8 12-3 5-16 5 15 17 2-14 8-6 10Z" fill="#65895c" />
            <path
              d="M39 52c-4 7-3 13 1 17"
              stroke="#f4b59d"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path d="M73 73c4-2 7-5 9-9" stroke="#bb5e4c" strokeWidth="3" strokeLinecap="round" />
          </>
        ))}
      {category === 'dairy' && (
        <>
          <path d="M39 30l12-16h24l12 16v51H39Z" fill="#fdfbf4" stroke="#839b94" strokeWidth="2" />
          <path d="M51 14v16h36L75 14Z" fill="#c3d6db" />
          <path d="M39 46h48v23H39Z" fill="#7eaaa6" />
          <path d="M59 57c4-7 5-9 5-9s11 13 6 17c-7 6-16-2-11-8Z" fill="#f4f7ed" />
          <path d="M75 30v51M42 32h31" stroke="#839b94" strokeWidth="2" />
        </>
      )}
      {category === 'grains' && (
        <>
          <path d="M26 65C16 36 38 20 56 30 67 14 97 31 94 49l-5 33H32Z" fill="#d8a66d" />
          <path d="M36 64c-10-24 8-33 20-25 15-16 33 0 28 16l-5 19H39Z" fill="#f0d3a3" />
          <path
            d="M49 45l-4 14M63 41l-5 17M76 47l-5 14"
            stroke="#d3a66d"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {category === 'protein' && (
        <>
          <path d="M31 29h59l-5 51H36Z" fill="#d6c5a2" />
          <path d="M27 27h67v9H27Z" fill="#8d9671" />
          <path d="M38 45h45v26H38Z" fill="#fbf5e5" />
          <g fill="#d78c62">
            <ellipse cx="51" cy="53" rx="5" ry="3" transform="rotate(30 51 53)" />
            <ellipse cx="68" cy="59" rx="6" ry="4" transform="rotate(-30 68 59)" />
            <ellipse cx="53" cy="65" rx="5" ry="3" />
            <ellipse cx="74" cy="48" rx="4" ry="3" />
          </g>
        </>
      )}
      {category === 'other' && (
        <>
          <path d="M36 28h49l7 54H29Z" fill="#d5caae" />
          <path d="M34 27h53v11H34Z" fill="#a69d7d" />
          <path d="M42 48h35v22H42Z" fill="#fff9e9" />
          <path d="M54 65c-5-10 0-15 12-15-1 10-5 15-12 15Z" fill="#83a173" />
        </>
      )}
    </svg>
  )
}

export function PantryArt() {
  return (
    <svg viewBox="0 0 420 280" className="pantry-art" fill="none" aria-hidden="true">
      <circle cx="216" cy="136" r="112" fill="#2b604a" />
      <path d="M69 224H360" stroke="#9bb792" strokeWidth="2" strokeLinecap="round" opacity=".5" />
      <path d="M124 159h166l-18 71H141Z" fill="#d8b77e" />
      <path d="M119 159h177v15H119Z" fill="#f2d59c" />
      <path
        d="M149 183l5 34m25-34l3 34m26-34v34m27-34l-3 34m28-34l-5 34"
        stroke="#ae8e5c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M157 159c-16-30-31-54-20-74 4-8 13-9 17-2-3-24 20-29 26-9 14-11 26-1 22 14-3 15-18 49-19 71Z"
        fill="#a5c17d"
      />
      <path
        d="M171 157l-12-58m5 25l-14-10m21 30l16-29"
        stroke="#54815d"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M218 159v-59l12-20h30l13 20v59Z" fill="#fbf5de" />
      <path d="M230 80v20h43l-13-20Z" fill="#b9d1c7" />
      <path d="M218 115h55v25h-55Z" fill="#79a69a" />
      <path d="M243 121c-9 10-8 14-1 14s9-5 1-14Z" fill="#f5f7e7" />
      <path d="M260 100v59" stroke="#b9d1c7" strokeWidth="2" />
      <path d="M177 160c-10-30 8-49 26-40 16-15 38 7 26 40Z" fill="#df8770" />
      <path d="M197 124l-9-7h12l4-12 5 12 12 2-12 6-4 8Z" fill="#6d925a" />
      <path d="M266 160l19-58c4-14 27-8 26 5-2 16-19 41-30 53" fill="#eeaa66" />
      <path d="M294 102c-3-20 4-28 11-18 7-19 23-7 4 13 21-5 21 10-6 10Z" fill="#91b278" />
      <path d="M285 127l13 5m-18 11l9 3" stroke="#ca7b42" strokeWidth="3" strokeLinecap="round" />
      <g stroke="#d2dca9" strokeWidth="2" strokeLinecap="round">
        <path d="M102 76v14m-7-7h14M330 160v12m-6-6h12" />
        <path d="M303 52v8m-4-4h8" />
      </g>
      <circle cx="105" cy="174" r="4" fill="#deba78" />
      <circle cx="324" cy="109" r="3" fill="#adc785" />
      <path d="M200 44c13-17 34-19 48-10" stroke="#a5bf83" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M243 28l7 7-9 3"
        stroke="#a5bf83"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BrandMark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M9 26h30l-4 15H13Z" fill="currentColor" />
      <path d="M17 26c-2-13 5-21 18-21 0 12-6 20-18 21Z" fill="currentColor" opacity=".65" />
      <path d="M17 26L31 10" stroke="#fbf8ef" strokeWidth="1.8" />
      <path d="M8 26h32" stroke="#e7b66f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
