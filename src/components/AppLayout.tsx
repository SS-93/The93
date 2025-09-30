// AppLayout - Wrapper component to provide global UI elements within Router context
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BucketsSystemTray from './player/enhanced/BucketsSystemTray'
import FloatingActionButton from './FloatingActionButton'
import GlobalSystemMenu from './GlobalSystemMenu'

const AppLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <Outlet />
      <BucketsSystemTray />
      <FloatingActionButton
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />
      <GlobalSystemMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  )
}

export default AppLayout