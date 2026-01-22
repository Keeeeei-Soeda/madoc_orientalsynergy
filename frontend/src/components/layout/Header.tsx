'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getRoleLabel = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return '管理者'
      case 'COMPANY':
        return '企業'
      case 'STAFF':
        return 'スタッフ'
      default:
        return 'ユーザー'
    }
  }

  return (
    <header className="header d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center">
        <h5 className="mb-0">オリエンタルシナジー</h5>
      </div>
      
      <div className="d-flex align-items-center gap-3">
        {/* 通知アイコン */}
        <div className="position-relative">
          <button className="btn btn-sm btn-light">
            <i className="bi bi-bell"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              3
            </span>
          </button>
        </div>
        
        {/* ユーザーメニュー */}
        {user && (
          <div className="dropdown">
            <button 
              className="btn btn-sm btn-light dropdown-toggle" 
              type="button" 
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-person-circle me-2"></i>
              {user.name} ({getRoleLabel(user.role)})
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li className="dropdown-item-text">
                <small className="text-muted">{user.email}</small>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>プロフィール</a></li>
              <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2"></i>設定</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button 
                  className="dropdown-item text-danger" 
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>ログアウト
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  )
}

