'use client'

import React from 'react'
import { AuthGuard } from '@/lib/auth/AuthGuard'
import CompanySidebar from '@/components/layout/CompanySidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['COMPANY', 'ADMIN']}>
      <div className="admin-layout">
        <CompanySidebar />
        <div className="main-wrapper">
          <Header />
          <main className="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </AuthGuard>
  )
}

