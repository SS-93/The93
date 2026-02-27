import React from 'react'
import { NavLink } from 'react-router-dom'
import './DIASidebar.css'

interface MatrixLink {
  path: string
  label: string
  icon: string
  available: boolean
}

const matrices: MatrixLink[] = [
  { path: '/dia/users', label: 'User Matrix', icon: '👥', available: true },
  { path: '/dia/passport', label: 'Passport Events', icon: '🛂', available: true },
  { path: '/dia/engagement', label: 'Media Engagement', icon: '💫', available: false },
  { path: '/dia/listening', label: 'Listening History', icon: '🎧', available: false },
  { path: '/dia/events', label: 'Events', icon: '🎪', available: false },
  { path: '/dia/artists', label: 'Artists', icon: '🎤', available: false },
  { path: '/dia/content', label: 'Content', icon: '🎵', available: false }
]

export function DIASidebar() {
  return (
    <div className="dia-sidebar">
      <div className="sidebar-header">
        <h1>DIA</h1>
        <p className="sidebar-subtitle">Department of Internal Affairs</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Existing Tables</div>
          {matrices.map(matrix => (
            <NavLink
              key={matrix.path}
              to={matrix.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${!matrix.available ? 'disabled' : ''}`
              }
            >
              <span className="nav-icon">{matrix.icon}</span>
              <span className="nav-label">{matrix.label}</span>
              {!matrix.available && <span className="nav-badge">Soon</span>}
            </NavLink>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Future Systems</div>
          <div className="nav-link disabled">
            <span className="nav-icon">💰</span>
            <span className="nav-label">Treasury</span>
            <span className="nav-badge">Phase 3</span>
          </div>
          <div className="nav-link disabled">
            <span className="nav-icon">🏟️</span>
            <span className="nav-label">Coliseum</span>
            <span className="nav-badge">Phase 4</span>
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-dot active"></div>
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  )
}
