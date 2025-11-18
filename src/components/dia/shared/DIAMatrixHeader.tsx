import React from 'react'
import { MatrixStats } from './types'
import './DIAMatrixHeader.css'

interface DIAMatrixHeaderProps {
  title: string
  stats?: MatrixStats[]
  onRefresh?: () => void
  onExport?: () => void
  loading?: boolean
}

export function DIAMatrixHeader({
  title,
  stats,
  onRefresh,
  onExport,
  loading
}: DIAMatrixHeaderProps) {
  return (
    <div className="dia-matrix-header">
      <div className="header-top">
        <h2>{title}</h2>
        <div className="header-actions">
          {onRefresh && (
            <button
              className="btn-icon"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh"
            >
              {loading ? '⟳' : '↻'}
            </button>
          )}
          {onExport && (
            <button
              className="btn-icon"
              onClick={onExport}
              title="Export"
            >
              ⬇
            </button>
          )}
        </div>
      </div>
      {stats && stats.length > 0 && (
        <div className="header-stats">
          {stats.map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">
                {stat.icon && <span className="stat-icon">{stat.icon}</span>}
                {stat.value}
              </div>
              {stat.trend && (
                <div className={`stat-trend trend-${stat.trend}`}>
                  {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
