import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/noto-sans-arabic'
import './styles.css'
import { Root } from './Root'

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
import.meta.hot?.dispose(() => root.unmount())
