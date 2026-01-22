'use client'

import React from 'react'
import { AuthGuard } from '@/lib/auth/AuthGuard'
import StaffSidebar from '@/components/layout/StaffSidebar'
import StaffHeader from '@/components/layout/StaffHeader'
import Footer from '@/components/layout/Footer'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['STAFF', 'ADMIN']}>
      <div className="admin-layout">
        <StaffSidebar />
        <div className="main-wrapper">
          <StaffHeader />
          <main className="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </AuthGuard>
  )
}

