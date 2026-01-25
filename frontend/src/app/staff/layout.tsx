'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/lib/auth/AuthGuard'
import StaffSidebar from '@/components/layout/StaffSidebar'
import StaffHeader from '@/components/layout/StaffHeader'
import MobileHeader from '@/components/layout/MobileHeader'
import Footer from '@/components/layout/Footer'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <AuthGuard allowedRoles={['STAFF', 'ADMIN']}>
      <div className="admin-layout">
        {/* モバイルヘッダー（タブレット・スマホのみ表示） */}
        <MobileHeader 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          title="Oriental Synergy"
        />
        
        {/* サイドバー */}
        <StaffSidebar 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        
        <div className="main-wrapper">
          {/* PCヘッダー（PCのみ表示） */}
          <div className="d-none d-lg-block">
            <StaffHeader />
          </div>
          
          <main className="main-content staff-layout-content">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </AuthGuard>
  )
}


