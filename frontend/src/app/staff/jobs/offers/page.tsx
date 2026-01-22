'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { reservationsApi, assignmentsApi, Reservation, Assignment } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

interface OfferWithReservation extends Assignment {
  reservation?: Reservation;
}

export default function StaffOffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<OfferWithReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState(false)

  // 自分宛てのオファーを取得
  const fetchOffers = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      // 自分宛てのアサイン情報を取得（user_idから自動的にstaff_idを解決）
      const assignments = await assignmentsApi.getMyAssignments()
      
      console.log('取得したアサインメント:', assignments)
      
      // アサインメントに既に予約情報が含まれているので、それを使用
      const offersWithReservation = assignments.map(assignment => ({
        ...assignment,
        reservation: assignment.reservation ? {
          id: assignment.reservation.id,
          company_id: 0, // 予約サマリーには含まれていないが必須ではない
          office_name: assignment.reservation.office_name,
          office_address: assignment.reservation.office_address,
          reservation_date: assignment.reservation.reservation_date,
          start_time: assignment.reservation.start_time,
          end_time: assignment.reservation.end_time,
          hourly_rate: assignment.reservation.hourly_rate,
          time_slots: assignment.reservation.time_slots || [],
          max_participants: 0,
          slot_count: 0,
          slots_filled: 0,
          status: 'recruiting',
          notes: '',
          requirements: '',
          created_at: '',
          updated_at: ''
        } as Reservation : undefined
      }))
      
      setOffers(offersWithReservation)
    } catch (err: any) {
      setError(err.message || 'オファーデータの取得に失敗しました')
      console.error('オファー取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchOffers()
    }
  }, [user?.id])

  // オファーに回答（YES = confirmed, NO = rejected）
  const handleRespond = async (assignmentId: number, accept: boolean) => {
    const message = accept ? 'このオファーを受諾しますか？' : 'このオファーを辞退しますか？'
    if (!confirm(message)) return
    
    try {
      setResponding(true)
      await assignmentsApi.updateAssignment(assignmentId, {
        status: accept ? 'confirmed' : 'rejected'
      })
      
      alert(accept ? 'オファーを受諾しました！' : 'オファーを辞退しました。')
      
      // 一覧を再取得
      await fetchOffers()
    } catch (err: any) {
      // エラーメッセージを表示（確定数が上限に達している場合など）
      const errorMessage = err?.data?.detail || err.message || '回答の送信に失敗しました'
      alert(errorMessage)
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
          title="オファー確認"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: '業務一覧', href: '/staff/jobs' },
            { label: 'オファー確認' }
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

  // ステータス別に分類
  const pendingOffers = offers.filter(o => o.status === 'pending')
  const confirmedOffers = offers.filter(o => o.status === 'confirmed')
  const rejectedOffers = offers.filter(o => o.status === 'rejected')

  return (
    <>
      <PageHeader 
        title="オファー確認"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/staff/dashboard' },
          { label: '業務一覧', href: '/staff/jobs' },
          { label: 'オファー確認' }
        ]}
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
      
      {/* 回答待ちオファー */}
      {pendingOffers.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">
            <i className="bi bi-envelope-heart text-warning me-2"></i>
            回答待ちのオファー ({pendingOffers.length}件)
          </h5>
          <div className="row g-4">
            {pendingOffers.map((offer) => (
              <div key={offer.id} className="col-12 col-lg-6">
                <div className="card border-warning h-100">
                  <div className="card-header bg-warning bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        <i className="bi bi-envelope-heart me-2 text-warning"></i>
                        新しいオファー
                      </h6>
                      {offer.slot_number && (
                        <span className="badge bg-info">
                          枠{offer.slot_number}
                        </span>
                      )}
                    </div>
                    <small className="text-muted">
                      受信: {new Date(offer.assigned_at).toLocaleDateString('ja-JP')}
                    </small>
                  </div>
                  <div className="card-body">
                    {offer.reservation ? (
                      <>
                        <div className="mb-3">
                          <h6 className="fw-bold">{offer.reservation.office_name}</h6>
                          {offer.reservation.office_address && (
                            <p className="text-muted small mb-0">
                              <i className="bi bi-geo-alt me-1"></i>
                              {offer.reservation.office_address}
                            </p>
                          )}
                        </div>
                        
                        <div className="row g-3 mb-3">
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-calendar3 text-primary"></i>
                              <div>
                                <small className="text-muted d-block">日時</small>
                                <div className="fw-bold">{offer.reservation.reservation_date}</div>
                                <small>{offer.reservation.start_time} 〜 {offer.reservation.end_time}</small>
                              </div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-currency-yen text-success"></i>
                              <div>
                                <small className="text-muted d-block">時給</small>
                                <div className="fw-bold text-success">
                                  {offer.reservation.hourly_rate ? 
                                    `${offer.reservation.hourly_rate.toLocaleString()}円` : 
                                    '要確認'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 時間枠情報 */}
                        {offer.slot_number && offer.reservation.time_slots && offer.reservation.time_slots.length > 0 && (
                          <div className="alert alert-info mb-3">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-clock"></i>
                              <div>
                                <small className="text-muted d-block">担当時間枠</small>
                                {(() => {
                                  const slot = offer.reservation.time_slots.find((s: any) => s.slot === offer.slot_number)
                                  if (slot) {
                                    const earnings = offer.reservation.hourly_rate 
                                      ? Math.floor((slot.duration * offer.reservation.hourly_rate) / 60)
                                      : 0
                                    return (
                                      <div>
                                        <strong>{slot.start_time} 〜 {slot.end_time}</strong>
                                        <span className="text-muted ms-2">({slot.duration}分)</span>
                                        {earnings > 0 && (
                                          <div className="text-success fw-bold mt-1">
                                            報酬: {earnings.toLocaleString()}円
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                  return <span>枠{offer.slot_number}</span>
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {offer.reservation.requirements && (
                          <div className="mb-3">
                            <div className="border-start border-primary border-3 ps-3">
                              <small className="text-muted">要望</small>
                              <p className="mb-0 small">{offer.reservation.requirements}</p>
                            </div>
                          </div>
                        )}
                        
                        <Link 
                          href={`/staff/jobs/offers/${offer.id}`}
                          className="btn btn-outline-secondary w-100 mb-2"
                        >
                          <i className="bi bi-eye me-2"></i>
                          詳細を見る
                        </Link>
                        
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-success flex-grow-1"
                            onClick={() => handleRespond(offer.id, true)}
                            disabled={responding}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            受諾
                          </button>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleRespond(offer.id, false)}
                            disabled={responding}
                          >
                            <i className="bi bi-x-circle me-2"></i>
                            辞退
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-warning">
                        予約情報の取得に失敗しました
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 受諾済みオファー */}
      {confirmedOffers.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">
            <i className="bi bi-check-circle text-success me-2"></i>
            受諾済み ({confirmedOffers.length}件)
          </h5>
          <div className="row g-4">
            {confirmedOffers.map((offer) => (
              <div key={offer.id} className="col-12 col-lg-6">
                <div className="card border-success h-100">
                  <div className="card-header bg-success bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-success">
                        <i className="bi bi-check-circle me-2"></i>
                        確定済み
                      </h6>
                      {offer.slot_number && (
                        <span className="badge bg-info">
                          枠{offer.slot_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    {offer.reservation && (
                      <>
                        <h6 className="fw-bold">{offer.reservation.office_name}</h6>
                        <div className="mb-2">
                          <i className="bi bi-calendar3 me-2 text-primary"></i>
                          <span>{offer.reservation.reservation_date}</span>
                          <br />
                          <i className="bi bi-clock me-2 text-success"></i>
                          <span>{offer.reservation.start_time} 〜 {offer.reservation.end_time}</span>
                        </div>
                        <Link 
                          href={`/staff/jobs/offers/${offer.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          詳細を見る
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 辞退したオファー */}
      {rejectedOffers.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">
            <i className="bi bi-x-circle text-danger me-2"></i>
            辞退済み ({rejectedOffers.length}件)
          </h5>
          <div className="row g-4">
            {rejectedOffers.map((offer) => (
              <div key={offer.id} className="col-12 col-lg-6">
                <div className="card border-secondary h-100">
                  <div className="card-header bg-secondary bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-secondary">
                        <i className="bi bi-x-circle me-2"></i>
                        辞退済み
                      </h6>
                      {offer.slot_number && (
                        <span className="badge bg-secondary">
                          枠{offer.slot_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    {offer.reservation && (
                      <>
                        <h6 className="fw-bold text-muted">{offer.reservation.office_name}</h6>
                        <div>
                          <small className="text-muted">
                            {offer.reservation.reservation_date} {offer.reservation.start_time} 〜 {offer.reservation.end_time}
                          </small>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {offers.length === 0 && !loading && (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-envelope-heart fs-1 text-muted"></i>
            <p className="text-muted mt-3">オファーはありません。</p>
          </div>
        </div>
      )}
    </>
  )
}
