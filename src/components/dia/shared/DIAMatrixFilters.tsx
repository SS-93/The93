import React from 'react'
import { FilterDef } from './types'
import './DIAMatrixFilters.css'

interface DIAMatrixFiltersProps {
  filters: FilterDef[]
  activeFilters: Record<string, any>
  onFilterChange: (filters: Record<string, any>) => void
}

export function DIAMatrixFilters({
  filters,
  activeFilters,
  onFilterChange
}: DIAMatrixFiltersProps) {
  const updateFilter = (id: string, value: any) => {
    onFilterChange({ ...activeFilters, [id]: value })
  }

  const clearFilters = () => {
    onFilterChange({})
  }

  const activeCount = Object.values(activeFilters).filter(v =>
    v !== undefined && v !== null && v !== ''
  ).length

  return (
    <div className="dia-matrix-filters">
      <div className="filters-grid">
        {filters.map(filter => (
          <div key={filter.id} className="filter-field">
            {filter.label && <label>{filter.label}</label>}
            {renderFilterInput(filter, activeFilters[filter.id], (value) => updateFilter(filter.id, value))}
          </div>
        ))}
      </div>
      {activeCount > 0 && (
        <button className="clear-filters-btn" onClick={clearFilters}>
          Clear Filters ({activeCount})
        </button>
      )}
    </div>
  )
}

function renderFilterInput(
  filter: FilterDef,
  value: any,
  onChange: (value: any) => void
) {
  switch (filter.type) {
    case 'text':
      return (
        <input
          type="text"
          placeholder={filter.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">All</option>
          {filter.options?.map(opt => {
            const optValue = typeof opt === 'string' ? opt : opt.value
            const optLabel = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            )
          })}
        </select>
      )

    case 'boolean':
      return (
        <select
          value={value === undefined ? '' : value ? 'true' : 'false'}
          onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}
        >
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )

    case 'daterange':
      return (
        <div className="daterange-inputs">
          <input
            type="date"
            value={value?.start || ''}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            placeholder="From"
          />
          <span>to</span>
          <input
            type="date"
            value={value?.end || ''}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            placeholder="To"
          />
        </div>
      )

    default:
      return null
  }
}
