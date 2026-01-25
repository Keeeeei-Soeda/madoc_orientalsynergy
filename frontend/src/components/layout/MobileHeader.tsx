'use client'

import React from 'react'

interface MobileHeaderProps {
  onMenuToggle: () => void
  title?: string
}

export default function MobileHeader({ onMenuToggle, title = 'Oriental Synergy' }: MobileHeaderProps) {
  return (
    <div className="mobile-header d-lg-none">
      <button 
        className="mobile-menu-btn" 
        onClick={onMenuToggle}
        aria-label="メニューを開く"
      >
        <i className="bi bi-list"></i>
      </button>
      <h1 className="mobile-header-title">{title}</h1>
      <div className="mobile-header-actions">
        {/* 将来的にユーザーメニューなどを追加可能 */}
      </div>
    </div>
  )
}

