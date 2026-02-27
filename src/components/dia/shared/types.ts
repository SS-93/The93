// DIA Matrix shared types

export interface ColumnDef<T = any> {
  id: keyof T | string
  label: string
  sortable?: boolean
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'avatar'
  width?: string
  render?: (value: any, row: T) => React.ReactNode
}

export interface FilterDef {
  id: string
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'daterange' | 'number'
  label?: string
  placeholder?: string
  options?: string[] | { value: string; label: string }[]
}

export interface ActionDef<T = any> {
  id: string
  label: string
  icon?: string
  variant?: 'default' | 'primary' | 'danger'
  condition?: (row: T) => boolean
  onClick: (row: T) => void | Promise<void>
}

export interface BulkActionDef<T = any> {
  id: string
  label: string
  icon?: string
  variant?: 'default' | 'primary' | 'danger'
  onClick: (rows: T[]) => void | Promise<void>
}

export interface MatrixStats {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  icon?: string
}

export interface DIAMatrixProps<T> {
  title: string
  data: T[]
  columns: ColumnDef<T>[]
  filters?: FilterDef[]
  actions?: ActionDef<T>[]
  bulkActions?: BulkActionDef<T>[]
  stats?: MatrixStats[]
  loading?: boolean
  error?: Error | null
  expandableDetail?: (row: T) => React.ReactNode
  onRefresh?: () => Promise<void>
  onExport?: () => void
}
