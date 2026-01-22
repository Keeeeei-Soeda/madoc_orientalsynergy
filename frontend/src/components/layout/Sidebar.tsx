'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  title: string
  icon: string
  href: string
  badge?: number
  exact?: boolean // 完全一致のみでアクティブ判定（デフォルトは false で子パスも含む）
}

const menuItems: MenuItem[] = [
  { title: 'ダッシュボード', icon: 'bi-speedometer2', href: '/admin/dashboard', exact: true },
  { title: '企業管理', icon: 'bi-building', href: '/admin/companies' }, // 子ページも含める
  { title: 'スタッフ管理', icon: 'bi-people', href: '/admin/staff', exact: true }, // 完全一致のみ
  { title: 'スタッフ検索', icon: 'bi-search', href: '/admin/staff/search', exact: true }, // 完全一致のみ
  { title: '予約管理', icon: 'bi-calendar-check', href: '/admin/reservations' }, // 子ページも含める
  { title: '勤怠管理', icon: 'bi-clock-history', href: '/admin/attendance' }, // 子ページも含める
  { title: '通知管理', icon: 'bi-bell', href: '/admin/notifications', badge: 5, exact: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="sidebar">
      {/* ロゴ */}
      <div className="p-4 border-bottom">
        <h4 className="mb-0 text-admin fw-bold">Oriental<br />Synergy</h4>
        <small className="text-muted">管理画面</small>
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
                      ? 'text-white fw-bold bg-admin border-start border-admin border-3' 
                      : 'text-dark hover-bg-light'
                  }`}
                  style={{ transition: 'all 0.15s ease' }}
                >
                  <i className={`bi ${item.icon} fs-5`}></i>
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="badge bg-danger ms-auto">{item.badge}</span>
                  )}
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

