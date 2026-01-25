'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/lib/auth/AuthContext'
import { assignmentsApi, staffApi, Assignment } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function StaffShiftsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed'>('upcoming')
  const [currentPage, setCurrentPage] = useState(1)
  
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        // 方法1: getMyAssignments() を試す
        try {
          const data = await assignmentsApi.getMyAssignments()
          
          if (data && data.length > 0) {
            // 確定済みと完了済みのアサインのみフィルタ
            const relevantAssignments = data.filter(a => 
              a.status === 'confirmed'
            )
            setAssignments(relevantAssignments)
            setLoading(false)
            return
          }
        } catch (err) {
          // 404エラー（未実装）の場合は静かに代替方法へ
          if (err instanceof Error && err.message.includes('404')) {
            // 代替方法を試す
          } else {
            console.error('getMyAssignments失敗:', err)
          }
        }

        // 方法2: オファー画面と同じ方法（代替）
        const staffList = await staffApi.getAll(0, 100)
        const currentStaff = staffList.find(s => s.user_id === user.id)
        
        if (!currentStaff) {
          setError('スタッフ情報が見つかりません')
          setLoading(false)
          return
        }

        const data = await assignmentsApi.getStaffAssignments(currentStaff.id)
        
        // 確定済みと完了済みのアサインのみフィルタ
        const relevantAssignments = data.filter(a => 
          a.status === 'confirmed'
        )
        
        setAssignments(relevantAssignments)

      } catch (err) {
        // 404エラーの場合は空データを表示（エラーメッセージは表示しない）
        if (err instanceof Error && err.message.includes('404')) {
          setAssignments([])
        } else {
          setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        }
        console.error('シフトデータ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAssignments()
  }, [user?.id])
  
  // ステータスでフィルタリング
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const filteredAssignments = assignments.filter(assignment => {
    if (filterStatus === 'upcoming') {
      // 今後の予定: 確定済み（confirmed）のみ
      return assignment.status === 'confirmed'
    } else if (filterStatus === 'completed') {
      // 完了済み: 完了報告済みのマーカーがあるもの（現在の実装では confirmed のみ）
      // TODO: 将来的に completed ステータスを追加予定
      return false
    }
    // すべて: confirmed のみ（現在は completed がないため）
    return assignment.status === 'confirmed'
  })

  // 日付でソート（降順：新しい順）
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const dateA = new Date(a.reservation?.reservation_date?.replace(/\//g, '-') || 0)
    const dateB = new Date(b.reservation?.reservation_date?.replace(/\//g, '-') || 0)
    return dateB.getTime() - dateA.getTime()  // 降順（新しい順）
  })

  // ページネーション
  const itemsPerPage = 10
  const totalPages = Math.ceil(sortedAssignments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAssignments = sortedAssignments.slice(startIndex, endIndex)

  // フィルター変更時にページをリセット
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus])

  // 報酬計算
  const calculateEarnings = (assignment: Assignment) => {
    if (!assignment.reservation) return 0
    
    const { service_duration, hourly_rate, time_slots } = assignment.reservation
    
    // 枠指定がある場合
    if (assignment.slot_number && time_slots) {
      const slot = time_slots.find((s: any) => s.slot === assignment.slot_number)
      if (slot && hourly_rate) {
        return Math.round((slot.duration * hourly_rate) / 60)
      }
    }
    
    // 枠指定がない場合は全体の時間
    if (service_duration && hourly_rate) {
      return Math.round((service_duration * hourly_rate) / 60)
    }
    
    return 0
  }

  // 曜日取得
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString.replace(/\//g, '-'))
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }

  if (loading) {
    return (
      <>
        <PageHeader 
          title="シフト管理"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: 'シフト管理' }
          ]}
        />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader 
          title="シフト管理"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: 'シフト管理' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader 
        title="シフト管理"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/staff/dashboard' },
          { label: 'シフト管理' }
        ]}
      />
      
      {/* フィルター */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="btn-group w-100" role="group">
                <button 
                  type="button" 
                  className={`btn ${filterStatus === 'upcoming' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilterStatus('upcoming')}
                >
                  <i className="bi bi-calendar-event me-2"></i>
                  今後の予定 ({assignments.filter(a => a.status === 'confirmed').length})
                </button>
                <button 
                  type="button" 
                  className={`btn ${filterStatus === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilterStatus('completed')}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  完了 (0)
                </button>
                <button 
                  type="button" 
                  className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilterStatus('all')}
                >
                  <i className="bi bi-list-ul me-2"></i>
                  すべて ({assignments.length})
                </button>
              </div>
            </div>
            <div className="col-12 col-md-6 text-md-end">
              <div className="alert alert-info mb-0 py-2">
                <i className="bi bi-info-circle me-2"></i>
                {filterStatus === 'upcoming' && '受託済みの案件を表示しています'}
                {filterStatus === 'completed' && '完了報告済みの案件を表示しています'}
                {filterStatus === 'all' && 'すべての案件を表示しています'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* シフト一覧 */}
      <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-calendar-check me-2"></i>
                確定業務一覧 ({sortedAssignments.length}件)
              </h5>
              {totalPages > 1 && (
                <div className="text-muted small">
                  ページ {currentPage} / {totalPages}
                </div>
              )}
            </div>
        <div className="card-body p-0">
          {paginatedAssignments.length > 0 ? (
            <div className="table-responsive-cards">
              {/* PC表示: テーブル */}
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>日時</th>
                    <th>企業・事業所</th>
                    <th>時間</th>
                    <th>枠</th>
                    <th>報酬</th>
                    <th>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssignments.map((assignment) => {
                    if (!assignment.reservation) return null
                    
                    const { reservation } = assignment
                    const earnings = calculateEarnings(assignment)
                    const reservationDate = new Date(reservation.reservation_date.replace(/\//g, '-'))
                    const isToday = reservationDate.toDateString() === today.toDateString()
                    const isPast = reservationDate < today
                    
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
                          {reservation.office_address && (
                            <div className="text-muted small">
                              <i className="bi bi-geo-alt me-1"></i>
                              {reservation.office_address}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{reservation.start_time} 〜 {reservation.end_time}</div>
                          {reservation.service_duration && (
                            <small className="text-muted">施術: {reservation.service_duration}分</small>
                          )}
                        </td>
                        <td>
                          {assignment.slot_number ? (
                            <span className="badge bg-info">枠{assignment.slot_number}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="fw-bold text-success">{formatCurrency(earnings)}</div>
                          {reservation.hourly_rate && (
                            <small className="text-muted">時給: {formatCurrency(reservation.hourly_rate)}</small>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {isToday && !isPast && (
                              <Link 
                                href="/staff/attendance" 
                                className="btn btn-sm btn-success"
                                title="勤怠打刻"
                              >
                                <i className="bi bi-clock"></i>
                              </Link>
                            )}
                            <Link 
                              href={`/staff/jobs/offers/${assignment.id}`}
                              className="btn btn-sm btn-outline-primary"
                              title="案件詳細を見る"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {/* モバイル表示: カード */}
              <div className="mobile-card-list">
                {paginatedAssignments.map((assignment) => {
                  if (!assignment.reservation) return null
                  
                  const { reservation } = assignment
                  const reservationDate = new Date(reservation.reservation_date.replace(/\//g, '-'))
                  const isToday = reservationDate.toDateString() === today.toDateString()
                  const isPast = reservationDate < today
                  
                  // 枠の時間を取得
                  let slotTime = `${reservation.start_time} 〜 ${reservation.end_time}`
                  let slotDuration = reservation.service_duration || 0
                  
                  if (assignment.slot_number && reservation.time_slots && Array.isArray(reservation.time_slots)) {
                    const slot = reservation.time_slots.find((s: any) => s.slot === assignment.slot_number)
                    if (slot) {
                      slotTime = `${slot.start_time} 〜 ${slot.end_time}`
                      slotDuration = slot.duration || 0
                    }
                  }
                  
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
                          <div className="mobile-card-label">企業・事務所</div>
                          <div className="mobile-card-value fw-bold">{assignment.reservation?.company_name || '不明な企業'}</div>
                          <small className="text-muted">{reservation.office_name}</small>
                        </div>
                      </div>
                      
                      <div className="mobile-card-row mt-2">
                        <div className="flex-grow-1">
                          <div className="mobile-card-label">時間</div>
                          <div className="mobile-card-value">{slotTime}</div>
                          {slotDuration > 0 && (
                            <small className="text-muted">({slotDuration}分)</small>
                          )}
                        </div>
                      </div>
                      
                      <div className="mobile-card-actions">
                        {isToday && !isPast && (
                          <Link 
                            href="/staff/attendance" 
                            className="btn btn-success btn-sm"
                          >
                            <i className="bi bi-clock me-2"></i>
                            勤怠打刻
                          </Link>
                        )}
                        <Link 
                          href={`/staff/jobs/offers/${assignment.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-eye me-2"></i>
                          詳細を見る
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="card-footer">
                  <nav aria-label="ページネーション">
                    <ul className="pagination pagination-sm justify-content-center mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          前へ
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          次へ
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x fs-1 text-muted"></i>
              <p className="text-muted mt-3">
                {filterStatus === 'upcoming' && '今後の確定業務はありません'}
                {filterStatus === 'completed' && '完了した業務はありません'}
                {filterStatus === 'all' && '確定した業務がありません'}
              </p>
              <Link href="/staff/jobs/offers" className="btn btn-primary">
                <i className="bi bi-envelope-heart me-2"></i>
                オファーを確認
              </Link>
            </div>
          )}
        </div>
      </div>

    </>
  )
}
