import type { Action, Data, Item, ShoppingItem } from './model'

export type Page = 'pantry' | 'priority' | 'shopping' | 'activity' | 'data'
export type Dialog =
  | { type: 'item'; item?: Item }
  | { type: 'consume'; item: Item }
  | { type: 'delete'; item: Item }
  | { type: 'shopping'; item: ShoppingItem }
  | { type: 'import'; data: Data }
  | { type: 'reset' }
  | { type: 'clearChecked' }
  | null
export type Commit = (action: Action, message?: string) => boolean
export type Navigate = (page: Page) => void
export type OpenDialog = (dialog: Dialog) => void
