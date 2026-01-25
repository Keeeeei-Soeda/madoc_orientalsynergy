'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Link from 'next/link'
import { reservationsApi, assignmentsApi, Reservation, ReservationStatus, getCompanyStatusLabel, getStatusBadgeClass } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

// モックデータ（統計情報は後でAPI実装）
const statsData = [
  { title: '今月の予約数', value: 12, icon: 'bi-calendar-check', iconColor: 'primary', change: '+3 先月比', changeType: 'positive' as const },
  { title: '利用回数（累計）', value: 48, icon: 'bi-graph-up', iconColor: 'success' },
  { title: '今月の利用金額', value: '¥240,000', icon: 'bi-currency-yen', iconColor: 'info' },
  { title: '登録社員数', value: 25, icon: 'bi-people', iconColor: 'warning' },
]

export default function CompanyDashboardPage() {
  const { user } = useAuth()
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 今後の予約を取得（最新3件）
  useEffect(() => {
    const fetchUpcomingReservations = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        // すべての予約を取得
        const allReservations = await reservationsApi.getAll()

        // 今日以降の予約をフィルタリング
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const upcoming = allReservations
          .filter((reservation) => {
            // reservation_dateの形式: "2026/01/30"
            const [year, month, day] = reservation.reservation_date.split('/').map(Number)
            const reservationDate = new Date(year, month - 1, day)
            reservationDate.setHours(0, 0, 0, 0)
            return reservationDate >= today
          })
          .sort((a, b) => {
            // 日付でソート（昇順）
            const [yearA, monthA, dayA] = a.reservation_date.split('/').map(Number)
            const [yearB, monthB, dayB] = b.reservation_date.split('/').map(Number)
            const dateA = new Date(yearA, monthA - 1, dayA)
            const dateB = new Date(yearB, monthB - 1, dayB)
            return dateA.getTime() - dateB.getTime()
          })
          .slice(0, 3) // 最新3件のみ

        // 各予約のスタッフ情報を取得
        const reservationsWithStaff = await Promise.all(
          upcoming.map(async (reservation) => {
            try {
              const assignments = await assignmentsApi.getReservationAssignments(reservation.id)
              const confirmedAssignments = assignments.filter(a => a.status === 'confirmed')
              const staffNames = confirmedAssignments
                .map(a => a.staff_name)
                .filter(Boolean)
                .join(', ') || '未アサイン'
              
              return {
                ...reservation,
                staffNames
              }
            } catch (err) {
              console.error(`予約${reservation.id}のスタッフ情報取得エラー:`, err)
              return {
                ...reservation,
                staffNames: '未アサイン'
              }
            }
          })
        )

        setUpcomingReservations(reservationsWithStaff)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
        console.error('予約データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingReservations()
  }, [user?.id])

  // 日付フォーマット関数
  const formatDate = (dateStr: string) => {
    // "2026/01/30" 形式を "2026/01/30" として返す（既に正しい形式）
    return dateStr
  }

  // ステータスラベルとバッジクラスを取得
  const getStatusInfo = (status: string) => {
    const label = getCompanyStatusLabel(status as ReservationStatus)
    const badgeClass = getStatusBadgeClass(status as ReservationStatus)
    return { label, badgeClass }
  }

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
      
      <div className="row g-4">
        {/* 今後の予約 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">今後の予約</h5>
              <Link href="/company/reservations" className="btn btn-sm btn-outline-primary">
                すべて表示
              </Link>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">読み込み中...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-warning m-3" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              ) : upcomingReservations.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-calendar-x fs-1"></i>
                  <p className="mt-3">今後の予約はありません</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>事業所</th>
                        <th>日時</th>
                        <th>スタッフ</th>
                        <th>ステータス</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingReservations.map((reservation) => {
                        const { label, badgeClass } = getStatusInfo(reservation.status)
                        return (
                          <tr key={reservation.id}>
                            <td className="fw-bold">#{reservation.id}</td>
                            <td>{reservation.office_name}</td>
                            <td>
                              <div>{formatDate(reservation.reservation_date)}</div>
                              <small className="text-muted">
                                {reservation.start_time} ～ {reservation.end_time}
                              </small>
                            </td>
                            <td>{reservation.staff_names || '未アサイン'}</td>
                            <td>
                              <span className={`badge ${badgeClass}`}>
                                {label}
                              </span>
                            </td>
                            <td>
                              <Link 
                                href={`/company/reservations/${reservation.id}`} 
                                className="btn btn-sm btn-outline-primary"
                              >
                                詳細
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                <div className="col-6 col-md-6">
                  <Link href="/company/employees" className="btn btn-outline-success w-100">
                    <i className="bi bi-people me-2"></i>
                    社員管理
                  </Link>
                </div>
                <div className="col-6 col-md-6">
                  <Link href="/company/profile" className="btn btn-outline-secondary w-100">
                    <i className="bi bi-building me-2"></i>
                    企業情報
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

