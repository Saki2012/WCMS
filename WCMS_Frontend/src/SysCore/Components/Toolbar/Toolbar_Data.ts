export type ToolbarAction = {
  Id: string
  Title: string
  Type?: 'link' | 'button'
  Url?: string
  OnClick?: () => void
  IsDisabled?: boolean
  Confirm?: string // optional confirm message
}