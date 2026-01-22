'use client'

import React from 'react'
import { AuthGuard } from '@/lib/auth/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="admin-layout">
        <Sidebar />
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

