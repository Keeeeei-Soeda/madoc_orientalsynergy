'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  title: string
  icon: string
  href: string
  exact?: boolean // 完全一致のみでアクティブ判定（デフォルトは false で子パスも含む）
}

const menuItems: MenuItem[] = [
  { title: 'ダッシュボード', icon: 'bi-speedometer2', href: '/company/dashboard', exact: true },
  { title: '企業情報管理', icon: 'bi-building', href: '/company/profile', exact: true },
  { title: '社員管理', icon: 'bi-people', href: '/company/employees' }, // 子ページも含める
  { title: '予約管理', icon: 'bi-calendar-check', href: '/company/reservations' }, // 子ページも含める
  { title: '予約登録（社員用）', icon: 'bi-person-check', href: '/company/employee-bookings', exact: true },
  { title: '評価入力', icon: 'bi-star', href: '/company/evaluations' }, // 子ページも含める
  { title: '通知', icon: 'bi-bell', href: '/company/notifications', exact: true },
]

export default function CompanySidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="sidebar">
      {/* ロゴ */}
      <div className="p-4 border-bottom">
        <h4 className="mb-0 text-company fw-bold">Oriental<br />Synergy</h4>
        <small className="text-muted">企業側</small>
      </div>
      
      {/* メニュー */}
      <nav className="mt-3">
        <ul className="list-unstyled">
          {menuItems.map((item) => {
            // exact が true の場合は完全一致のみ、false/undefined の場合は子パスも含める
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`d-flex align-items-center gap-3 px-4 py-3 text-decoration-none position-relative ${
                    isActive 
                      ? 'text-white fw-bold bg-company border-start border-company border-3' 
                      : 'text-dark hover-bg-light'
                  }`}
                  style={{ transition: 'all 0.15s ease' }}
                >
                  <i className={`bi ${item.icon} fs-5`}></i>
                  <span>{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      {/* バージョン情報 */}
      <div className="position-absolute bottom-0 w-100 p-3 text-center text-muted small">
        v1.0.0
      </div>
    </aside>
  )
}

