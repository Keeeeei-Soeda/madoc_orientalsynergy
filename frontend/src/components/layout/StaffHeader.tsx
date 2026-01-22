'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { staffApi, Staff } from '@/lib/api'

export default function StaffHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [staffData, setStaffData] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)

  // スタッフ情報を取得
  useEffect(() => {
    const fetchStaffData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        const staffList = await staffApi.getAll(0, 100)
        // user_idで検索（nameではなくuser_idで紐付ける）
        const currentStaff = staffList.find(s => s.user_id === user.id)
        if (currentStaff) {
          setStaffData(currentStaff)
        }
      } catch (err) {
        console.error('スタッフ情報取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStaffData()
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/login')
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
              {loading ? (
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
              ) : staffData ? (
                `${staffData.name} (スタッフ)`
              ) : (
                `${user.name} (スタッフ)`
              )}
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li className="dropdown-item-text">
                <small className="text-muted">{user.email}</small>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="/staff/mypage"><i className="bi bi-person me-2"></i>プロフィール</a></li>
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

