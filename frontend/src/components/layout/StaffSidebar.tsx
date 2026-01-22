'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  title: string
  icon: string
  href: string
  badge?: number
  exact?: boolean // 完全一致のみでアクティブ判定
}

const menuItems: MenuItem[] = [
  { title: 'ダッシュボード', icon: 'bi-speedometer2', href: '/staff/dashboard', exact: true },
  { title: 'マイページ', icon: 'bi-person-circle', href: '/staff/mypage', exact: true },
  { title: 'オファー', icon: 'bi-envelope-heart', href: '/staff/jobs/offers', exact: true, badge: 3 },
  { title: 'シフト管理', icon: 'bi-calendar3', href: '/staff/shifts', exact: true },
  { title: '勤怠管理', icon: 'bi-clock-history', href: '/staff/attendance', exact: true },
  { title: '評価確認', icon: 'bi-star', href: '/staff/evaluations', exact: true },
  { title: '通知', icon: 'bi-bell', href: '/staff/notifications', exact: true },
]

export default function StaffSidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="sidebar">
      {/* ロゴ */}
      <div className="p-4 border-bottom">
        <h4 className="mb-0 text-staff fw-bold">Oriental<br />Synergy</h4>
        <small className="text-muted">スタッフ側</small>
      </div>
      
      {/* メニュー */}
      <nav className="mt-3">
        <ul className="list-unstyled">
          {menuItems.map((item) => {
            // exact が true の場合は完全一致のみ、false の場合は子パスも含める
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`d-flex align-items-center gap-3 px-4 py-3 text-decoration-none position-relative ${
                    isActive 
                      ? 'text-white fw-bold bg-staff border-start border-staff border-3' 
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

