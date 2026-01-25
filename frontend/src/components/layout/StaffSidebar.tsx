'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { assignmentsApi } from '@/lib/api'

interface MenuItem {
  title: string
  icon: string
  href: string
  badge?: number | null
  exact?: boolean // 完全一致のみでアクティブ判定
}

interface StaffSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function StaffSidebar({ isOpen = false, onClose }: StaffSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [pendingOffersCount, setPendingOffersCount] = useState<number>(0)

  // 新しいオファー（pending状態）の数を取得
  const fetchPendingOffers = async () => {
    if (!user?.id) return
    
    try {
      const assignments = await assignmentsApi.getMyAssignments()
      // pending状態のオファーのみをカウント
      const pendingCount = assignments.filter(a => a.status === 'pending').length
      setPendingOffersCount(pendingCount)
    } catch (err) {
      // 404エラー（未実装）の場合は静かに処理
      if (err instanceof Error && err.message.includes('404')) {
        setPendingOffersCount(0)
      } else {
        console.error('オファー取得エラー:', err)
      }
    }
  }
  
  useEffect(() => {
    fetchPendingOffers()
    
    // カスタムイベントをリスンして、オファー状態が変更されたら再取得
    const handleOfferStatusChanged = () => {
      fetchPendingOffers()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('offerStatusChanged', handleOfferStatusChanged)
      
      return () => {
        window.removeEventListener('offerStatusChanged', handleOfferStatusChanged)
      }
    }
  }, [user?.id])

  const menuItems: MenuItem[] = [
    { title: 'ダッシュボード', icon: 'bi-speedometer2', href: '/staff/dashboard', exact: true },
    { title: 'マイページ', icon: 'bi-person-circle', href: '/staff/mypage', exact: true },
    { title: 'オファー', icon: 'bi-envelope-heart', href: '/staff/jobs/offers', exact: true, badge: pendingOffersCount > 0 ? pendingOffersCount : null },
    { title: 'シフト管理', icon: 'bi-calendar3', href: '/staff/shifts', exact: true },
    { title: '勤怠管理', icon: 'bi-clock-history', href: '/staff/attendance', exact: true },
    { title: '評価確認', icon: 'bi-star', href: '/staff/evaluations', exact: true },
    { title: '通知', icon: 'bi-bell', href: '/staff/notifications', exact: true },
  ]
  
  const handleMenuClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* オーバーレイ背景（モバイルのみ） */}
      {isOpen && (
        <div 
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={onClose}
        />
      )}
      
      {/* サイドバー */}
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
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
                    onClick={handleMenuClick}
                  >
                    <i className={`bi ${item.icon} fs-5 d-none d-lg-inline`}></i>
                    <span>{item.title}</span>
                    {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
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
    </>
  )
}

