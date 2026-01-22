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
  
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        // 方法1: getMyAssignments() を試す
        try {
          const data = await assignmentsApi.getMyAssignments()
          console.log('getMyAssignments結果:', data)
          
          if (data && data.length > 0) {
            // 確定済みと完了済みのアサインのみフィルタ
            const relevantAssignments = data.filter(a => 
              a.status === 'confirmed' || a.status === 'completed'
            )
            console.log('フィルタ後のデータ件数:', relevantAssignments.length)
            setAssignments(relevantAssignments)
            setLoading(false)
            return
          }
        } catch (err) {
          console.log('getMyAssignments失敗、代替方法を試します:', err)
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
        console.log('getStaffAssignments結果:', data)
        
        // 確定済みと完了済みのアサインのみフィルタ
        const relevantAssignments = data.filter(a => 
          a.status === 'confirmed' || a.status === 'completed'
        )
        
        console.log('フィルタ後のデータ件数:', relevantAssignments.length)
        setAssignments(relevantAssignments)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
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
      // 完了済み: 完了報告済み（completed）のみ
      return assignment.status === 'completed'
    }
    // すべて: confirmed と completed の両方
    return true
  })

  // 日付でソート（昇順）
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const dateA = new Date(a.reservation?.reservation_date?.replace(/\//g, '-') || 0)
    const dateB = new Date(b.reservation?.reservation_date?.replace(/\//g, '-') || 0)
    return dateA.getTime() - dateB.getTime()
  })

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
                  完了 ({assignments.filter(a => a.status === 'completed').length})
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
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-calendar-check me-2"></i>
            確定業務一覧 ({sortedAssignments.length}件)
          </h5>
        </div>
        <div className="card-body p-0">
          {sortedAssignments.length > 0 ? (
            <div className="table-responsive">
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
                  {sortedAssignments.map((assignment) => {
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
                          <div className="fw-bold">{reservation.company_name || '不明な企業'}</div>
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
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              title="詳細"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

      {/* サマリーカード */}
      {sortedAssignments.length > 0 && (
        <div className="row g-3 mt-3">
          <div className="col-12 col-md-4">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h3 className="mb-0">{sortedAssignments.length}件</h3>
                <small className="text-muted">確定業務数</small>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h3 className="mb-0 text-success">
                  {formatCurrency(sortedAssignments.reduce((sum, a) => sum + calculateEarnings(a), 0))}
                </h3>
                <small className="text-muted">予定報酬合計</small>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h3 className="mb-0 text-primary">
                  {assignments.filter(a => a.status === 'confirmed').length}件
                </h3>
                <small className="text-muted">今後の予定</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
