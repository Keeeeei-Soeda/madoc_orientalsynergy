'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import TimeSlotDisplay, { TimeSlotWithEmployee } from '@/components/reservations/TimeSlotDisplay'
import { reservationsApi, assignmentsApi, companiesApi, Reservation, Assignment } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function StaffOfferDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const assignmentId = parseInt(params.id as string)
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [companyName, setCompanyName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState(false)
  
  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // スタッフ情報を取得（user_idで検索）
        const staffData = await fetch(`http://localhost:8000/api/v1/staff`, {
          headers: {
            'Authorization': `Bearer ${document.cookie.split('access_token=')[1]?.split(';')[0]}`
          }
        }).then(res => res.json())

        if (!staffData || staffData.length === 0) {
          setError('スタッフ情報が見つかりません')
          return
        }

        // user_idで検索（nameではなくuser_idで紐付ける）
        const currentStaff = staffData.find((s: any) => s.user_id === user.id)
        
        if (!currentStaff) {
          setError('スタッフ情報が見つかりません')
          return
        }

        const staffId = currentStaff.id
        
        // 自分宛てのアサイン情報を取得
        const assignments = await assignmentsApi.getStaffAssignments(staffId)
        const targetAssignment = assignments.find(a => a.id === assignmentId)
        
        if (!targetAssignment) {
          setError('オファーが見つかりませんでした')
          return
        }
        
        setAssignment(targetAssignment)
        
        // 予約情報を取得
        const reservationData = await reservationsApi.getById(targetAssignment.reservation_id)
        setReservation(reservationData)
        
        // 企業情報を取得
        try {
          const company = await companiesApi.getById(reservationData.company_id)
          setCompanyName(company.company_name)
        } catch (err) {
          console.error('企業情報の取得に失敗しました:', err)
          setCompanyName('企業情報取得エラー')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        console.error('データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (assignmentId && user?.id) {
      fetchData()
    }
  }, [assignmentId, user?.id])
  
  // オファーに回答
  const handleRespond = async (accept: boolean) => {
    if (!assignment) return
    
    const message = accept ? 'このオファーを受諾しますか？' : 'このオファーを辞退しますか？'
    if (!confirm(message)) return
    
    try {
      setResponding(true)
      await assignmentsApi.updateAssignment(assignment.id, {
        status: accept ? 'confirmed' : 'rejected'
      })
      
      alert(accept ? 'オファーを受諾しました！' : 'オファーを辞退しました。')
      
      // オファー一覧に戻る
      router.push('/staff/jobs/offers')
    } catch (err: any) {
      alert('回答の送信に失敗しました: ' + (err.message || ''))
      console.error('回答送信エラー:', err)
    } finally {
      setResponding(false)
    }
  }
  
  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader 
          title="オファー詳細" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: '業務一覧', href: '/staff/jobs' },
            { label: 'オファー確認', href: '/staff/jobs/offers' },
            { label: 'オファー詳細' }
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
  if (error || !assignment || !reservation) {
    return (
      <>
        <PageHeader 
          title="オファー詳細" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: '業務一覧', href: '/staff/jobs' },
            { label: 'オファー確認', href: '/staff/jobs/offers' },
            { label: 'オファー詳細' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'オファーが見つかりませんでした'}
        </div>
      </>
    )
  }
  
  const timeSlots = (reservation.time_slots || []) as TimeSlotWithEmployee[]
  const targetSlot = assignment.slot_number 
    ? timeSlots.find(s => s.slot === assignment.slot_number)
    : null
  
  // 報酬計算
  const calculateEarnings = () => {
    if (!reservation.hourly_rate) return 0
    
    if (targetSlot) {
      // 枠指定の場合、その枠の報酬
      return Math.floor((targetSlot.duration * reservation.hourly_rate) / 60)
    } else if (reservation.service_duration) {
      // 枠指定なしの場合、全体の時間で計算
      const totalMinutes = timeSlots.reduce((sum, slot) => sum + slot.duration, 0)
      return Math.floor((totalMinutes * reservation.hourly_rate) / 60)
    }
    
    return 0
  }
  
  const earnings = calculateEarnings()
  
  // ステータスバッジ
  const getStatusBadge = () => {
    switch (assignment.status) {
      case 'pending':
        return <span className="badge bg-warning">回答待ち</span>
      case 'confirmed':
        return <span className="badge bg-success">受諾済み</span>
      case 'rejected':
        return <span className="badge bg-danger">辞退済み</span>
      default:
        return <span className="badge bg-secondary">{assignment.status}</span>
    }
  }
  
  return (
    <>
      <PageHeader 
        title={`オファー詳細 #${assignment.id}`}
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/staff/dashboard' },
          { label: '業務一覧', href: '/staff/jobs' },
          { label: 'オファー確認', href: '/staff/jobs/offers' },
          { label: `オファー #${assignment.id}` }
        ]}
      />
      
      <div className="row g-4">
        {/* 基本情報 */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-envelope-heart me-2"></i>
                  オファー情報
                </h5>
                {getStatusBadge()}
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  {companyName && (
                    <div className="mb-2">
                      <span className="badge bg-primary me-2">
                        <i className="bi bi-building me-1"></i>
                        {companyName}
                      </span>
                    </div>
                  )}
                  <h4>{reservation.office_name}</h4>
                  {reservation.office_address && (
                    <p className="text-muted mb-0">
                      <i className="bi bi-geo-alt me-2"></i>
                      {reservation.office_address}
                    </p>
                  )}
                </div>
                
                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-calendar3 text-primary fs-4"></i>
                    <div>
                      <small className="text-muted d-block">予約日</small>
                      <span className="fw-bold">{reservation.reservation_date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-3">
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
                
                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-currency-yen text-success fs-4"></i>
                    <div>
                      <small className="text-muted d-block">時給</small>
                      <span className="fw-bold text-success">
                        {reservation.hourly_rate ? 
                          `${reservation.hourly_rate.toLocaleString()}円` : 
                          '要確認'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-cash-coin text-warning fs-4"></i>
                    <div>
                      <small className="text-muted d-block">報酬予定</small>
                      <span className="fw-bold text-warning">
                        {earnings > 0 ? `${earnings.toLocaleString()}円` : '計算中'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 担当枠情報 */}
        {targetSlot && (
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-header bg-info bg-opacity-10">
                <h5 className="mb-0">
                  <i className="bi bi-clock-history me-2 text-info"></i>
                  担当時間枠
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <div className="badge bg-info mb-2">枠{targetSlot.slot}</div>
                        <h4 className="mb-2">{targetSlot.start_time} 〜 {targetSlot.end_time}</h4>
                        <p className="text-muted mb-0">{targetSlot.duration}分</p>
                        {reservation.hourly_rate && (
                          <div className="mt-3">
                            <small className="text-muted">報酬</small>
                            <h5 className="text-success mb-0">
                              {Math.floor((targetSlot.duration * reservation.hourly_rate) / 60).toLocaleString()}円
                            </h5>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="alert alert-info mb-0">
                      <h6 className="alert-heading">
                        <i className="bi bi-info-circle me-2"></i>
                        この時間枠のみを担当
                      </h6>
                      <p className="mb-0">
                        このオファーは特定の時間枠（枠{targetSlot.slot}）への割り当てです。
                        他の枠は別のスタッフが担当します。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 全時間枠表示 */}
        {timeSlots.length > 0 && (
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  全体の時間枠構成
                </h5>
              </div>
              <div className="card-body">
                <TimeSlotDisplay
                  slots={timeSlots}
                  hourlyRate={reservation.hourly_rate}
                  readOnly={true}
                  hideEmployeeInfo={true}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 要望・備考 */}
        {(reservation.requirements || reservation.notes) && (
          <div className="col-12">
            <div className="card mb-4">
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
        
        {/* アクションボタン（回答待ちの場合のみ） */}
        {assignment.status === 'pending' && (
          <div className="col-12">
            <div className="card border-warning">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="bi bi-question-circle me-2 text-warning"></i>
                  このオファーに回答してください
                </h5>
                <p className="text-muted">
                  このオファーを受諾する場合は「受諾」ボタン、辞退する場合は「辞退」ボタンを押してください。
                </p>
                <div className="d-flex gap-3">
                  <button 
                    className="btn btn-success btn-lg flex-grow-1"
                    onClick={() => handleRespond(true)}
                    disabled={responding}
                  >
                    {responding ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        送信中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        受諾する
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-lg"
                    onClick={() => handleRespond(false)}
                    disabled={responding}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    辞退する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 確定済みメッセージ */}
        {assignment.status === 'confirmed' && (
          <div className="col-12">
            <div className="alert alert-success">
              <h5 className="alert-heading">
                <i className="bi bi-check-circle me-2"></i>
                このオファーは受諾済みです
              </h5>
              <p className="mb-0">
                予約日までに必要な準備を行ってください。
              </p>
            </div>
          </div>
        )}
        
        {/* 辞退済みメッセージ */}
        {assignment.status === 'rejected' && (
          <div className="col-12">
            <div className="alert alert-secondary">
              <h5 className="alert-heading">
                <i className="bi bi-x-circle me-2"></i>
                このオファーは辞退済みです
              </h5>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

