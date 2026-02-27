import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { DIASidebar } from './DIASidebar'
import { UserMatrix } from './matrices/UserMatrix'
import { PassportMatrix } from './matrices/PassportMatrix'
import './DIADashboard.css'

export function DIADashboard() {
  return (
    <div className="dia-dashboard">
      <DIASidebar />
      <div className="dia-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dia/users" replace />} />
          <Route path="/users" element={<UserMatrix />} />
          <Route path="/passport" element={<PassportMatrix />} />
          <Route path="/engagement" element={<ComingSoon title="Media Engagement Matrix" />} />
          <Route path="/listening" element={<ComingSoon title="Listening History Matrix" />} />
          <Route path="/events" element={<ComingSoon title="Events Matrix" />} />
          <Route path="/artists" element={<ComingSoon title="Artist Matrix" />} />
          <Route path="/content" element={<ComingSoon title="Content Matrix" />} />
        </Routes>
      </div>
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="coming-soon-page">
      <h2>{title}</h2>
      <p>This matrix is coming soon...</p>
    </div>
  )
}
