import React, { useState } from 'react'
import { ColumnDef } from './types'
import './DIAMatrixTable.css'

interface DIAMatrixTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  expandableDetail?: (row: T) => React.ReactNode
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  selectedRows?: T[]
  onSelectRow?: (row: T, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
}

export function DIAMatrixTable<T extends { id: string }>({
  data,
  columns,
  expandableDetail,
  onSort,
  selectedRows = [],
  onSelectRow,
  onSelectAll
}: DIAMatrixTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const toggleExpand = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (columnId: string) => {
    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(columnId)
    setSortDirection(newDirection)
    onSort?.(columnId, newDirection)
  }

  const formatValue = (value: any, column: ColumnDef<T>) => {
    if (column.render) {
      return column.render(value, data[0])
    }

    switch (column.type) {
      case 'boolean':
        return value ? '✅' : '❌'
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-'
      case 'badge':
        return <span className={`badge badge-${value}`}>{value}</span>
      default:
        return value ?? '-'
    }
  }

  const isSelected = (row: T) => selectedRows.some(r => r.id === row.id)
  const allSelected = data.length > 0 && selectedRows.length === data.length

  return (
    <div className="dia-matrix-table">
      <table>
        <thead>
          <tr>
            {onSelectRow && (
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </th>
            )}
            {expandableDetail && <th className="expand-cell"></th>}
            {columns.map(column => (
              <th
                key={String(column.id)}
                style={{ width: column.width }}
                className={column.sortable ? 'sortable' : ''}
                onClick={() => column.sortable && handleSort(String(column.id))}
              >
                {column.label}
                {column.sortable && sortColumn === column.id && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (expandableDetail ? 1 : 0) + (onSelectRow ? 1 : 0)} className="empty-state">
                No data available
              </td>
            </tr>
          ) : (
            data.map(row => (
              <React.Fragment key={row.id}>
                <tr className={isSelected(row) ? 'selected' : ''}>
                  {onSelectRow && (
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected(row)}
                        onChange={(e) => onSelectRow(row, e.target.checked)}
                      />
                    </td>
                  )}
                  {expandableDetail && (
                    <td className="expand-cell">
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpand(row.id)}
                      >
                        {expandedRows.has(row.id) ? '▼' : '▶'}
                      </button>
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={String(column.id)}>
                      {formatValue(row[column.id as keyof T], column)}
                    </td>
                  ))}
                </tr>
                {expandableDetail && expandedRows.has(row.id) && (
                  <tr className="expanded-detail">
                    <td colSpan={columns.length + 2}>
                      <div className="detail-content">
                        {expandableDetail(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
