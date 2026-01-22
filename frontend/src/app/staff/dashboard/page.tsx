'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Link from 'next/link'
import { staffApi, assignmentsApi, StaffEarnings } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function StaffDashboardPage() {
  const { user } = useAuth()
  const [staffId, setStaffId] = useState<number | null>(null)
  const [earnings, setEarnings] = useState<StaffEarnings | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 現在の月と年
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  // スタッフIDを取得
  useEffect(() => {
    const fetchStaffId = async () => {
      if (!user?.id) return
      
      try {
        const staffList = await staffApi.getAll(0, 100)
        // user_idで検索（nameではなくuser_idで紐付ける）
        const currentStaff = staffList.find(s => s.user_id === user.id)
        if (currentStaff) {
          setStaffId(currentStaff.id)
        }
      } catch (err) {
        console.error('スタッフ情報取得エラー:', err)
      }
    }
    
    fetchStaffId()
  }, [user])
  
  // 給与情報を取得
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!staffId) return
      
      try {
        setLoading(true)
        const earningsData = await staffApi.getEarnings(staffId, currentMonth, currentYear)
        setEarnings(earningsData)
      } catch (err) {
        console.error('給与情報取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (staffId) {
      fetchEarnings()
    }
  }, [staffId, currentMonth, currentYear])
  
  // 統計データ
  const statsData = [
    { 
      title: '今月の勤務日数', 
      value: earnings?.assignment_count || 0, 
      icon: 'bi-calendar-check', 
      iconColor: 'primary' 
    },
    { 
      title: '今月の収入予定', 
      value: earnings ? `¥${earnings.total_earnings.toLocaleString()}` : '¥0', 
      icon: 'bi-currency-yen', 
      iconColor: 'success' 
    },
    { 
      title: '新しいオファー', 
      value: 0, 
      icon: 'bi-envelope-heart', 
      iconColor: 'warning', 
      change: '要確認', 
      changeType: 'warning' as const 
    },
    { 
      title: '平均評価', 
      value: '4.8', 
      icon: 'bi-star-fill', 
      iconColor: 'info' 
    },
  ]

  return (
    <>
      <PageHeader title="ダッシュボード" />
      
      {/* 統計カード */}
      <div className="row g-3 mb-4">
        {statsData.map((stat, index) => (
          <div key={index} className="col-12 col-sm-6 col-xl-3">
            <StatCard {...stat} />
          </div>
        ))}
      </div>
      
      {/* 給与サマリー */}
      {earnings && earnings.assignment_count > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-currency-yen me-2"></i>
              今月の給与サマリー ({currentYear}年{currentMonth}月)
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small mb-2">総給与</div>
                  <div className="fs-2 fw-bold text-success">
                    ¥{earnings.total_earnings.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small mb-2">総勤務時間</div>
                  <div className="fs-4 fw-bold">
                    {Math.floor(earnings.total_duration / 60)}時間{earnings.total_duration % 60}分
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small mb-2">確定済みアサイン</div>
                  <div className="fs-4 fw-bold text-primary">
                    {earnings.assignment_count}件
                  </div>
                </div>
              </div>
            </div>
            
            {earnings.details.length > 0 && (
              <div className="mt-4">
                <h6 className="mb-3">給与明細</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>予約日</th>
                        <th>事業所</th>
                        <th>枠</th>
                        <th>時間</th>
                        <th>時給</th>
                        <th className="text-end">報酬</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.details.map((detail, index) => (
                        <tr key={index}>
                          <td>{detail.reservation_date}</td>
                          <td>{detail.office_name}</td>
                          <td>
                            {detail.slot_number ? (
                              <span className="badge bg-info">枠{detail.slot_number}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{detail.duration}分</td>
                          <td>¥{detail.hourly_rate.toLocaleString()}</td>
                          <td className="text-end fw-bold text-success">
                            ¥{detail.earnings.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-active">
                        <td colSpan={5} className="fw-bold">合計</td>
                        <td className="text-end fw-bold text-success fs-5">
                          ¥{earnings.total_earnings.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="row g-4">
        {/* 今後のシフト */}
        <div className="col-12 col-xl-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">今後のシフト</h5>
              <Link href="/staff/shifts" className="btn btn-sm btn-outline-success">
                すべて表示
              </Link>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                シフト情報は準備中です。
              </div>
            </div>
          </div>
        </div>
        
        {/* 新しいオファー */}
        <div className="col-12 col-xl-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">新しいオファー</h5>
              <Link href="/staff/jobs/offers" className="btn btn-sm btn-outline-success">
                すべて表示
              </Link>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <Link href="/staff/jobs/offers">オファー確認画面</Link>から確認できます。
              </div>
            </div>
          </div>
        </div>
        
        {/* クイックアクション */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">クイックアクション</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <Link href="/staff/shifts" className="btn btn-outline-primary w-100">
                    <i className="bi bi-calendar-check me-2"></i>
                    シフト管理
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link href="/staff/mypage" className="btn btn-outline-success w-100">
                    <i className="bi bi-person-circle me-2"></i>
                    マイページ
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link href="/staff/jobs/offers" className="btn btn-outline-warning w-100">
                    <i className="bi bi-envelope-heart me-2"></i>
                    オファー確認
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link href="/staff/evaluations" className="btn btn-outline-info w-100">
                    <i className="bi bi-star me-2"></i>
                    評価確認
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
