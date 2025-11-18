import React, { useState } from 'react'
import { DIAMatrixProps } from './types'
import { DIAMatrixHeader } from './DIAMatrixHeader'
import { DIAMatrixFilters } from './DIAMatrixFilters'
import { DIAMatrixTable } from './DIAMatrixTable'
import './DIAMatrix.css'

export function DIAMatrix<T extends { id: string }>({
  title,
  data,
  columns,
  filters = [],
  actions = [],
  bulkActions = [],
  stats,
  loading = false,
  error = null,
  expandableDetail,
  onRefresh,
  onExport
}: DIAMatrixProps<T>) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [selectedRows, setSelectedRows] = useState<T[]>([])

  const handleSelectRow = (row: T, selected: boolean) => {
    if (selected) {
      setSelectedRows([...selectedRows, row])
    } else {
      setSelectedRows(selectedRows.filter(r => r.id !== row.id))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? [...data] : [])
  }

  const handleBulkAction = async (actionId: string) => {
    const action = bulkActions.find(a => a.id === actionId)
    if (action) {
      await action.onClick(selectedRows)
      setSelectedRows([])
    }
  }

  if (error) {
    return (
      <div className="dia-matrix-error">
        <h3>Error loading {title}</h3>
        <p>{error.message}</p>
        {onRefresh && (
          <button onClick={onRefresh}>Retry</button>
        )}
      </div>
    )
  }

  return (
    <div className="dia-matrix">
      <DIAMatrixHeader
        title={title}
        stats={stats}
        onRefresh={onRefresh}
        onExport={onExport}
        loading={loading}
      />

      {filters.length > 0 && (
        <DIAMatrixFilters
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
        />
      )}

      {selectedRows.length > 0 && bulkActions.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="selected-count">
            {selectedRows.length} selected
          </span>
          <div className="bulk-actions">
            {bulkActions.map(action => (
              <button
                key={action.id}
                className={`bulk-action-btn ${action.variant || 'default'}`}
                onClick={() => handleBulkAction(action.id)}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="dia-matrix-loading">
          <div className="spinner"></div>
          <p>Loading {title.toLowerCase()}...</p>
        </div>
      ) : (
        <DIAMatrixTable
          data={data}
          columns={columns}
          expandableDetail={expandableDetail}
          selectedRows={selectedRows}
          onSelectRow={bulkActions.length > 0 ? handleSelectRow : undefined}
          onSelectAll={bulkActions.length > 0 ? handleSelectAll : undefined}
        />
      )}
    </div>
  )
}
