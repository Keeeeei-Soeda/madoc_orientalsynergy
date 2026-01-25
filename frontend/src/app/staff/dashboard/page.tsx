'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Link from 'next/link'
import { staffApi, assignmentsApi, StaffEarnings, Assignment } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function StaffDashboardPage() {
  const { user } = useAuth()
  const [staffId, setStaffId] = useState<number | null>(null)
  const [earnings, setEarnings] = useState<StaffEarnings | null>(null)
  const [pendingOffersCount, setPendingOffersCount] = useState<number>(0)
  const [pendingOffers, setPendingOffers] = useState<Assignment[]>([])
  const [upcomingShifts, setUpcomingShifts] = useState<Assignment[]>([])
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
        console.log('給与情報取得開始:', { staffId, currentMonth, currentYear })
        const earningsData = await staffApi.getEarnings(staffId, currentMonth, currentYear)
        console.log('給与情報取得成功:', earningsData)
        setEarnings(earningsData)
      } catch (err) {
        console.error('給与情報取得エラー:', err)
        // エラー時も空データを設定してUIが壊れないようにする
        setEarnings(null)
      } finally {
        setLoading(false)
      }
    }

    if (staffId) {
      fetchEarnings()
    }
  }, [staffId, currentMonth, currentYear])

  // 新しいオファー（pending状態）を取得
  useEffect(() => {
    const fetchPendingOffers = async () => {
      if (!user?.id) return

      try {
        const assignments = await assignmentsApi.getMyAssignments()
        // pending状態のオファーのみをフィルタ
        const pending = assignments.filter(a =>
          a.status === 'pending' && a.reservation
        )

        // 日付でソート（昇順）
        const sorted = [...pending].sort((a, b) => {
          const dateA = new Date(a.reservation?.reservation_date?.replace(/\//g, '-') || 0)
          const dateB = new Date(b.reservation?.reservation_date?.replace(/\//g, '-') || 0)
          return dateA.getTime() - dateB.getTime()
        })

        setPendingOffers(sorted)
        setPendingOffersCount(sorted.length)
      } catch (err) {
        // 404エラー（未実装）の場合は静かに処理
        if (err instanceof Error && err.message.includes('404')) {
          setPendingOffers([])
          setPendingOffersCount(0)
        } else {
          console.error('オファー取得エラー:', err)
          setPendingOffers([])
          setPendingOffersCount(0)
        }
      }
    }

    fetchPendingOffers()
  }, [user?.id])

  // 今後のシフト（確定済みの予定）を取得
  useEffect(() => {
    const fetchUpcomingShifts = async () => {
      if (!user?.id) return

      try {
        // 方法1: getMyAssignments() を試す
        let assignments: Assignment[] = []
        try {
          const data = await assignmentsApi.getMyAssignments()
          if (data && data.length > 0) {
            assignments = data
          }
        } catch (err) {
          // 404エラー（未実装）の場合は代替方法へ
          if (err instanceof Error && err.message.includes('404')) {
            // 代替方法を試す
          } else {
            console.error('getMyAssignments失敗:', err)
          }
        }

        // 方法2: 代替方法（getMyAssignmentsが失敗した場合）
        if (assignments.length === 0 && staffId) {
          try {
            const data = await assignmentsApi.getStaffAssignments(staffId)
            assignments = data
          } catch (err) {
            // 404エラーの場合は空データを表示
            if (err instanceof Error && err.message.includes('404')) {
              setUpcomingShifts([])
              return
            }
            console.error('シフトデータ取得エラー:', err)
          }
        }

        // 確定済み（confirmed）のアサインのみフィルタ
        const confirmedAssignments = assignments.filter(a =>
          a.status === 'confirmed' && a.reservation
        )

        // 今日以降の予定のみをフィルタ
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const upcoming = confirmedAssignments.filter(assignment => {
          if (!assignment.reservation) return false
          const reservationDate = new Date(assignment.reservation.reservation_date.replace(/\//g, '-'))
          reservationDate.setHours(0, 0, 0, 0)
          return reservationDate >= today
        })

        // 日付でソート（昇順）
        const sorted = [...upcoming].sort((a, b) => {
          const dateA = new Date(a.reservation?.reservation_date?.replace(/\//g, '-') || 0)
          const dateB = new Date(b.reservation?.reservation_date?.replace(/\//g, '-') || 0)
          return dateA.getTime() - dateB.getTime()
        })

        setUpcomingShifts(sorted)
      } catch (err) {
        console.error('今後のシフト取得エラー:', err)
        setUpcomingShifts([])
      }
    }

    if (user?.id) {
      fetchUpcomingShifts()
    }
  }, [user?.id, staffId])

  // 曜日取得
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString.replace(/\//g, '-'))
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }

  // 統計データ
  const statsData = [
    {
      title: '今月の勤務数',
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
      value: pendingOffersCount,
      icon: 'bi-envelope-heart',
      iconColor: 'warning',
      change: pendingOffersCount > 0 ? '要確認' : undefined,
      changeType: 'warning' as const
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
                  <table className="table table-sm earnings-table">
                    <thead>
                      <tr>
                        <th>予約日</th>
                        <th>事業所</th>
                        <th className="d-none d-md-table-cell">枠</th>
                        <th>時間</th>
                        <th className="d-none d-md-table-cell">時給</th>
                        <th className="text-end">報酬</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.details.map((detail, index) => (
                        <tr key={index}>
                          <td>{detail.reservation_date}</td>
                          <td>{detail.office_name}</td>
                          <td className="d-none d-md-table-cell">
                            {detail.slot_number ? (
                              <span className="badge bg-info">枠{detail.slot_number}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{detail.duration}分</td>
                          <td className="d-none d-md-table-cell">¥{detail.hourly_rate.toLocaleString()}</td>
                          <td className="text-end fw-bold text-success">
                            ¥{detail.earnings.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-active">
                        <td colSpan={3} className="fw-bold d-none d-md-table-cell">合計</td>
                        <td colSpan={2} className="fw-bold d-md-none">合計</td>
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
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">今後のシフト</h5>
              <Link href="/staff/shifts" className="btn btn-sm btn-outline-success">
                すべて表示
              </Link>
            </div>
            <div className="card-body">
              {upcomingShifts.length > 0 ? (
                <div className="table-responsive-cards">
                  {/* PC表示: テーブル */}
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>日時</th>
                        <th>企業名・事務所名</th>
                        <th>時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingShifts.slice(0, 5).map((assignment) => {
                        if (!assignment.reservation) return null

                        const { reservation } = assignment
                        const reservationDate = new Date(reservation.reservation_date.replace(/\//g, '-'))
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const isToday = reservationDate.toDateString() === today.toDateString()

                        return (
                          <tr key={assignment.id} className={isToday ? 'table-warning' : ''}>
                            <td>
                              <div className="fw-bold">
                                {reservation.reservation_date}
                                {isToday && <span className="badge bg-warning text-dark ms-2">今日</span>}
                              </div>
                              <small className="text-muted">({getDayOfWeek(reservation.reservation_date)})</small>
                            </td>
                            <td>
                              <div className="fw-bold">{assignment.reservation?.company_name || '不明な企業'}</div>
                              <small className="text-muted">{reservation.office_name}</small>
                            </td>
                            <td>
                              <div>{reservation.start_time} 〜 {reservation.end_time}</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* モバイル表示: カード */}
                  <div className="mobile-card-list">
                    {upcomingShifts.slice(0, 5).map((assignment) => {
                      if (!assignment.reservation) return null

                      const { reservation } = assignment
                      const reservationDate = new Date(reservation.reservation_date.replace(/\//g, '-'))
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const isToday = reservationDate.toDateString() === today.toDateString()

                      return (
                        <div key={assignment.id} className={`mobile-card ${isToday ? 'today' : ''}`}>
                          <div className="mobile-card-row">
                            <div className="flex-grow-1">
                              <div className="mobile-card-label">日時</div>
                              <div className="mobile-card-value primary">
                                {reservation.reservation_date}
                                {isToday && <span className="badge bg-warning text-dark ms-2">今日</span>}
                              </div>
                              <small className="text-muted">({getDayOfWeek(reservation.reservation_date)})</small>
                            </div>
                          </div>
                          <div className="mobile-card-row mt-2">
                            <div className="flex-grow-1">
                              <div className="mobile-card-label">企業名・事務所名</div>
                              <div className="mobile-card-value fw-bold">{assignment.reservation?.company_name || '不明な企業'}</div>
                              <small className="text-muted">{reservation.office_name}</small>
                            </div>
                          </div>
                          <div className="mobile-card-row mt-2">
                            <div className="flex-grow-1">
                              <div className="mobile-card-label">時間</div>
                              <div className="mobile-card-value">{reservation.start_time} 〜 {reservation.end_time}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {upcomingShifts.length > 5 && (
                    <div className="text-center mt-3">
                      <Link href="/staff/shifts" className="btn btn-sm btn-outline-primary">
                        すべて表示 ({upcomingShifts.length}件)
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  今後の確定済みシフトはありません。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 新しいオファー */}
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">新しいオファー</h5>
              <Link href="/staff/jobs/offers" className="btn btn-sm btn-outline-success">
                すべて表示
              </Link>
            </div>
            <div className="card-body">
              {pendingOffers.length > 0 ? (
                <div className="table-responsive-cards">
                  {/* PC表示: テーブル */}
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>日時</th>
                        <th>企業名・事務所名</th>
                        <th>時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOffers.slice(0, 5).map((assignment) => {
                        if (!assignment.reservation) return null

                        const { reservation } = assignment
                        const reservationDate = new Date(reservation.reservation_date.replace(/\//g, '-'))
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const isToday = reservationDate.toDateString() === today.toDateString()

                        return (
                          <tr key={assignment.id} className={isToday ? 'table-warning' : ''}>
                            <td>
                              <div className="fw-bold">
                                {reservation.reservation_date}
                                {isToday && <span className="badge bg-warning text-dark ms-2">今日</span>}
                              </div>
                              <small className="text-muted">({getDayOfWeek(reservation.reservation_date)})</small>
                            </td>
                            <td>
                              <div className="fw-bold">{assignment.reservation?.company_name || '不明な企業'}</div>
                              <small className="text-muted">{reservation.office_name}</small>
                            </td>
                            <td>
                              <div>{reservation.start_time} 〜 {reservation.end_time}</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* モバイル表示: カード */}
                  <div className="mobile-card-list">
                    {pendingOffers.slice(0, 5).map((assignment) => {
                      if (!assignment.reservation) return null

                      const { reservation } = assignment
                      const reservationDate = new Date(reservation.reservation_date.replace(/\//g, '-'))
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const isToday = reservationDate.toDateString() === today.toDateString()

                      return (
                        <div key={assignment.id} className={`mobile-card ${isToday ? 'today' : ''}`}>
                          <div className="mobile-card-row">
                            <div className="flex-grow-1">
                              <div className="mobile-card-label">日時</div>
                              <div className="mobile-card-value primary">
                                {reservation.reservation_date}
                                {isToday && <span className="badge bg-warning text-dark ms-2">今日</span>}
                              </div>
                              <small className="text-muted">({getDayOfWeek(reservation.reservation_date)})</small>
                            </div>
                          </div>
                          <div className="mobile-card-row mt-2">
                            <div className="flex-grow-1">
                              <div className="mobile-card-label">企業名・事務所名</div>
                              <div className="mobile-card-value fw-bold">{assignment.reservation?.company_name || '不明な企業'}</div>
                              <small className="text-muted">{reservation.office_name}</small>
                            </div>
                          </div>
                          <div className="mobile-card-row mt-2">
                            <div className="flex-grow-1">
                              <div className="mobile-card-label">時間</div>
                              <div className="mobile-card-value">{reservation.start_time} 〜 {reservation.end_time}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {pendingOffers.length > 5 && (
                    <div className="text-center mt-3">
                      <Link href="/staff/jobs/offers" className="btn btn-sm btn-outline-primary">
                        すべて表示 ({pendingOffers.length}件)
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  新しいオファーはありません。
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
