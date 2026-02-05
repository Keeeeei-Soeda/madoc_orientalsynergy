'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import TimeSlotDisplay, { TimeSlotWithEmployee } from '@/components/reservations/TimeSlotDisplay'
import { reservationsApi, employeesApi, assignmentsApi, ratingsApi, Reservation, Employee, Assignment, getCompanyStatusLabel, getStatusBadgeClass } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function CompanyReservationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const reservationId = parseInt(params.id as string)
  
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [evaluatedStaffIds, setEvaluatedStaffIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  
  // データ取得関数（依存配列にrefreshCounterを追加）
  const fetchData = useCallback(async () => {
    if (!user?.id || !reservationId) return
    
    console.log('データ取得開始...', { reservationId, userId: user.id, refreshCounter })
    
    try {
      setLoading(true)
      setError(null)
      
      // 予約データ、社員データ、アサインメントデータを並行取得
      const [reservationData, employeesData, assignmentsData] = await Promise.all([
        reservationsApi.getById(reservationId),
        employeesApi.getAll(user.id),  // 企業IDで絞り込み
        assignmentsApi.getReservationAssignments(reservationId)  // アサインメント情報を取得
      ])
      
      console.log('データ取得成功:', { 
        reservation: reservationData, 
        employeesCount: employeesData.length,
        assignmentsCount: assignmentsData.length,
        slotsFilled: reservationData.slots_filled,
        totalSlots: reservationData.slot_count
      })
      
      setReservation(reservationData)
      setEmployees(employeesData)
      setAssignments(assignmentsData)
      
      // 評価済みのスタッフIDをチェック
      const evaluatedSet = new Set<number>()
      const checkPromises = assignmentsData
        .filter(a => a.status === 'confirmed')
        .map(async (assignment) => {
          try {
            const checkResult = await ratingsApi.checkExists(reservationId, assignment.staff_id)
            if (checkResult.exists) {
              evaluatedSet.add(assignment.staff_id)
            }
          } catch (err) {
            console.error(`評価チェックエラー (staff_id: ${assignment.staff_id}):`, err)
          }
        })
      
      await Promise.all(checkPromises)
      setEvaluatedStaffIds(evaluatedSet)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
      console.error('予約データ取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }, [reservationId, user?.id, refreshCounter])
  
  // 初回データ取得
  useEffect(() => {
    console.log('useEffect: 初回データ取得')
    fetchData()
  }, [fetchData])
  
  // URLパラメータでリフレッシュが指定されている場合
  useEffect(() => {
    const refresh = searchParams.get('refresh')
    if (refresh === 'true') {
      console.log('URLパラメータによるリフレッシュ - データを再取得します')
      // URLパラメータをクリア
      router.replace(`/company/reservations/${reservationId}`, { scroll: false })
      // データを強制的に再取得
      setRefreshCounter(prev => prev + 1)
    }
  }, [searchParams, reservationId, router])
  
  // ルーター変更時にもデータを再取得（戻るボタンで戻ってきた場合など）
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('ルート変更検知 - データを再取得します')
      setRefreshCounter(prev => prev + 1)
    }
    
    // Next.jsのルーター変更を監視
    window.addEventListener('popstate', handleRouteChange)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])
  
  // ページ可視性の変更を監視（タブ切り替え、別ウィンドウから戻ってきたときなど）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('ページが表示されました。データを再取得します。')
        setRefreshCounter(prev => prev + 1)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  // 社員割り当て
  const handleAssignEmployee = async (slotNumber: number) => {
    setSelectedSlotNumber(slotNumber)
    setShowEmployeeModal(true)
    
    // モーダルを開く際に最新の従業員リストを取得
    if (user?.id) {
      try {
        console.log('従業員リストを更新中...')
        const employeesData = await employeesApi.getAll(user.id)
        setEmployees(employeesData)
        console.log('従業員リスト更新完了:', employeesData.length, '件')
      } catch (err) {
        console.error('従業員リスト取得エラー:', err)
      }
    }
  }
  
  // 社員選択
  const handleSelectEmployee = async (employeeId: number) => {
    if (!selectedSlotNumber || !reservation) return
    
    try {
      setAssigning(true)
      const updated = await reservationsApi.assignEmployeeToSlot(
        reservation.id,
        employeeId,
        selectedSlotNumber
      )
      
      console.log('割り当て成功 - データを更新:', updated)
      
      // 状態を更新
      setReservation(updated)
      setShowEmployeeModal(false)
      setSelectedSlotNumber(null)
      
      // 成功メッセージを表示
      const employee = employees.find(e => e.id === employeeId)
      alert(`${employee?.name}さんを枠${selectedSlotNumber}に割り当てました`)
      
      // 念のため、少し待ってから再取得
      setTimeout(() => {
        console.log('割り当て後の再取得')
        setRefreshCounter(prev => prev + 1)
      }, 500)
    } catch (err) {
      console.error('割り当てエラー:', err)
      alert('社員の割り当てに失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setAssigning(false)
    }
  }
  
  // 社員割り当て解除
  const handleUnassignEmployee = async (slotNumber: number) => {
    if (!reservation) return
    
    if (!confirm('この社員の割り当てを解除してもよろしいですか？')) {
      return
    }
    
    try {
      const updated = await reservationsApi.unassignEmployeeFromSlot(
        reservation.id,
        slotNumber
      )
      
      console.log('割り当て解除成功 - データを更新:', updated)
      setReservation(updated)
      
      // 念のため、少し待ってから再取得
      setTimeout(() => {
        console.log('割り当て解除後の再取得')
        setRefreshCounter(prev => prev + 1)
      }, 500)
    } catch (err) {
      console.error('割り当て解除エラー:', err)
      alert('割り当て解除に失敗しました: ' + (err instanceof Error ? err.message : ''))
    }
  }
  
  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader 
          title="予約詳細" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約管理', href: '/company/reservations' },
            { label: '予約詳細' }
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
  
  // エラー表示
  if (error || !reservation) {
    return (
      <>
        <PageHeader 
          title="予約詳細" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約管理', href: '/company/reservations' },
            { label: '予約詳細' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || '予約が見つかりませんでした'}
        </div>
      </>
    )
  }
  
  const statusLabel = getCompanyStatusLabel(reservation.status)
  const badgeClass = getStatusBadgeClass(reservation.status)
  const timeSlots = (reservation.time_slots || []) as TimeSlotWithEmployee[]
  
  // 割り当て済み枠数
  const assignedCount = timeSlots.filter(slot => slot.is_filled).length
  const totalSlots = timeSlots.length
  
  // 確定済みのアサインメント（すべての確定済み）
  const confirmedAssignments = assignments.filter(a => a.status === 'confirmed')
  
  // 完了報告済みのアサインメント（評価対象）
  const completedAssignments = assignments.filter(a => a.status === 'confirmed')
  
  return (
    <>
      <PageHeader 
        title={`予約詳細 #${reservation.id}`}
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '予約管理', href: '/company/reservations' },
          { label: `予約 #${reservation.id}` }
        ]}
      />
      
      {/* リフレッシュボタン */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div className="text-muted small">
          最終更新: {new Date().toLocaleTimeString('ja-JP')}
        </div>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={() => {
            console.log('🔄 手動リフレッシュボタンクリック')
            setRefreshCounter(prev => prev + 1)
          }}
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spinner-border spinner-border-sm' : ''}`}></i>
          {loading ? '更新中...' : 'データを更新'}
        </button>
      </div>
      
      <div className="row g-4">
        {/* 基本情報 */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">予約情報</h5>
                <span className={`badge ${badgeClass}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <h4>{reservation.office_name}</h4>
                  {reservation.office_address && (
                    <p className="text-muted mb-0">
                      <i className="bi bi-geo-alt me-2"></i>
                      {reservation.office_address}
                    </p>
                  )}
                </div>
                
                <div className="col-12 col-md-4">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-calendar3 text-primary fs-4"></i>
                    <div>
                      <small className="text-muted d-block">訪問日</small>
                      <span className="fw-bold">{reservation.reservation_date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-4">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-clock text-success fs-4"></i>
                    <div>
                      <small className="text-muted d-block">時間</small>
                      <span className="fw-bold">
                        {reservation.start_time} 〜 {reservation.end_time}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-4">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-people text-info fs-4"></i>
                    <div>
                      <small className="text-muted d-block">社員割り当て</small>
                      <span className="fw-bold">
                        {assignedCount} / {totalSlots} 枠
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 時間枠と社員割り当て */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  時間枠と社員割り当て
                </h5>
                {assignedCount < totalSlots && (
                  <span className="badge bg-warning">
                    {totalSlots - assignedCount}枠 未割り当て
                  </span>
                )}
              </div>
            </div>
            <div className="card-body">
              {timeSlots.length > 0 ? (
                <TimeSlotDisplay
                  slots={timeSlots}
                  onAssignEmployee={handleAssignEmployee}
                  onUnassignEmployee={handleUnassignEmployee}
                  hideEarnings={true}
                />
              ) : (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  この予約には時間枠が設定されていません。
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* スタッフ評価（完了報告済みの案件のみ） */}
        {completedAssignments.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-star me-2"></i>
                  スタッフ評価（完了報告済み）
                </h5>
                <small className="text-muted">
                  完了報告されたスタッフの評価を行うことができます
                </small>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '10%' }}>枠</th>
                        <th style={{ width: '25%' }}>スタッフ名</th>
                        <th style={{ width: '25%' }}>時間</th>
                        <th style={{ width: '15%' }}>ステータス</th>
                        <th style={{ width: '25%' }}>評価</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedAssignments.map((assignment) => {
                        const slot = timeSlots.find(s => s.slot === assignment.slot_number)
                        return (
                          <tr key={assignment.id}>
                            <td>
                              <span className="badge bg-primary">枠 {assignment.slot_number}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-person-circle fs-4 me-2 text-secondary"></i>
                                <div>
                                  <div className="fw-bold">{assignment.staff_name || 'スタッフ情報なし'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {slot ? (
                                <>
                                  <i className="bi bi-clock me-1"></i>
                                  {slot.start_time} 〜 {slot.end_time}
                                  <br />
                                  <small className="text-muted">({slot.duration}分)</small>
                                </>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-info">
                                <i className="bi bi-clipboard-check me-1"></i>
                                完了報告済み
                              </span>
                            </td>
                            <td>
                              {evaluatedStaffIds.has(assignment.staff_id) ? (
                                <div>
                                  <span className="badge bg-success me-2">
                                    <i className="bi bi-check-circle me-1"></i>
                                    評価済み
                                  </span>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                      alert('このスタッフは既に評価済みです。')
                                    }}
                                    disabled
                                  >
                                    <i className="bi bi-star me-1"></i>
                                    評価する
                                  </button>
                                </div>
                              ) : (
                                <Link
                                  href={`/company/reservations/${reservation.id}/evaluate/${assignment.id}`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <i className="bi bi-star me-1"></i>
                                  評価する
                                </Link>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 要望・備考 */}
        {(reservation.requirements || reservation.notes) && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">要望・備考</h5>
              </div>
              <div className="card-body">
                {reservation.requirements && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">要望</label>
                    <p className="mb-0">{reservation.requirements}</p>
                  </div>
                )}
                {reservation.notes && (
                  <div>
                    <label className="form-label fw-bold">備考</label>
                    <p className="mb-0">{reservation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 社員選択モーダル */}
      {showEmployeeModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  社員を選択 (枠{selectedSlotNumber})
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEmployeeModal(false)
                    setSelectedSlotNumber(null)
                  }}
                  disabled={assigning}
                ></button>
              </div>
              <div className="modal-body">
                {employees.length === 0 ? (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    社員が登録されていません。
                  </div>
                ) : (
                  <div className="list-group">
                    {employees
                      .filter(emp => emp.is_active)
                      .map(employee => (
                        <button
                          key={employee.id}
                          className="list-group-item list-group-item-action"
                          onClick={() => handleSelectEmployee(employee.id)}
                          disabled={assigning}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-bold">{employee.name}</div>
                              <small className="text-muted">
                                {employee.department}
                                {employee.position && ` - ${employee.position}`}
                              </small>
                            </div>
                            <i className="bi bi-chevron-right"></i>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success me-auto"
                  onClick={() => {
                    // 従業員登録画面に遷移
                    const returnUrl = `/company/reservations/${reservationId}?refresh=true&t=${Date.now()}`
                    router.push(`/company/employees/new?returnTo=${encodeURIComponent(returnUrl)}`)
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  従業員を登録する
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEmployeeModal(false)
                    setSelectedSlotNumber(null)
                  }}
                  disabled={assigning}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
