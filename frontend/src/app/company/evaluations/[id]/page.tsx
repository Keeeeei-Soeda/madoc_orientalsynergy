'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import { reservationsApi, ratingsApi, assignmentsApi, companiesApi, Reservation, Assignment } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function EvaluationFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const reservationId = parseInt(resolvedParams.id)
  const router = useRouter()
  const { user } = useAuth()
  
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [ratings, setRatings] = useState<{
    [staffId: number]: {
      rating: number
      comment: string
    }
  }>({})

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 予約情報を取得
        const reservationData = await reservationsApi.getById(reservationId)
        setReservation(reservationData)
        
        // 既に評価済みの場合はエラー
        if (reservationData.status === 'evaluated' || reservationData.status === 'closed') {
          setError('この予約は既に評価済みです')
          setLoading(false)
          return
        }
        
        // 企業IDを取得
        if (user) {
          const companies = await companiesApi.getAll()
          const userCompany = companies.find(c => c.user_id === user.id)
          if (userCompany) {
            setCompanyId(userCompany.id)
          }
        }
        
        // アサイン情報を取得（スタッフ一覧）
        const assignmentsData = await assignmentsApi.getReservationAssignments(reservationId)
        setAssignments(assignmentsData)
        
        // 初期値設定
        const initialRatings: any = {}
        assignmentsData.forEach(assignment => {
          initialRatings[assignment.staff_id] = {
            rating: 0,
            comment: ''
          }
        })
        setRatings(initialRatings)
        
      } catch (err: any) {
        setError(err.message || 'データの取得に失敗しました')
        console.error('データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [reservationId, user])

  // 評価を変更
  const handleRatingChange = (staffId: number, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        rating
      }
    }))
  }

  // コメントを変更
  const handleCommentChange = (staffId: number, comment: string) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        comment
      }
    }))
  }

  // 評価を送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!companyId) {
      alert('企業情報が取得できませんでした')
      return
    }
    
    // 評価が入力されているか確認
    const hasRatings = Object.values(ratings).some(r => r.rating > 0)
    if (!hasRatings) {
      alert('少なくとも1人のスタッフを評価してください')
      return
    }
    
    try {
      setSubmitting(true)
      
      // 各スタッフの評価を送信
      for (const [staffIdStr, ratingData] of Object.entries(ratings)) {
        if (ratingData.rating > 0) {
          const staffId = parseInt(staffIdStr)
          await ratingsApi.create({
            reservation_id: reservationId,
            company_id: companyId,
            staff_id: staffId,
            cleanliness: ratingData.rating,
            responsiveness: ratingData.rating,
            satisfaction: ratingData.rating,
            punctuality: ratingData.rating,
            skill: ratingData.rating,
            comment: ratingData.comment || undefined
          })
        }
      }
      
      // すべてのスタッフの評価が完了したかチェック
      const allRated = assignments.every(assignment => {
        const rating = ratings[assignment.staff_id]
        return rating && rating.rating > 0
      })
      
      // すべてのスタッフの評価が完了した場合のみ、ステータスを「評価済み」に更新
      if (allRated) {
        await reservationsApi.update(reservationId, {
          status: 'evaluated'
        })
      }
      
      alert('評価を送信しました')
      router.push('/company/evaluations')
      
    } catch (err: any) {
      alert('評価の送信に失敗しました: ' + (err.message || ''))
      console.error('評価送信エラー:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader
          title="評価入力"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '評価入力', href: '/company/evaluations' },
            { label: '評価フォーム' }
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

  if (error || !reservation) {
    return (
      <>
        <PageHeader
          title="評価入力"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '評価入力', href: '/company/evaluations' },
            { label: '評価フォーム' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || '予約が見つかりません'}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="評価入力"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '評価入力', href: '/company/evaluations' },
          { label: `予約 #${reservationId}` }
        ]}
      />

      <form onSubmit={handleSubmit}>
        {/* 予約情報 */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-calendar-check me-2"></i>
              予約情報
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label text-muted">予約ID</label>
                <div className="fw-bold">#{reservation.id}</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted">実施事業所</label>
                <div className="fw-bold">{reservation.office_name}</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted">実施日時</label>
                <div className="fw-bold">
                  {reservation.reservation_date} {reservation.start_time} 〜 {reservation.end_time}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted">社員</label>
                <div className="fw-bold">{reservation.employee_names || '未定'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* スタッフ評価 */}
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">
              <i className="bi bi-star me-2"></i>
              スタッフ評価
            </h5>
          </div>
          <div className="card-body">
            {assignments.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1"></i>
                <p className="mt-3">アサインされたスタッフがいません</p>
              </div>
            ) : (
              assignments.map((assignment, index) => (
                <div key={assignment.id} className={`${index > 0 ? 'border-top pt-4 mt-4' : ''}`}>
                  <h6 className="mb-3">
                    <i className="bi bi-person-circle me-2"></i>
                    {assignment.staff_name}
                  </h6>
                  
                  {/* 評価（星） */}
                  <div className="mb-3">
                    <label className="form-label">
                      評価 <span className="text-danger">*</span>
                    </label>
                    <div className="btn-group" role="group">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`btn ${
                            ratings[assignment.staff_id]?.rating >= star
                              ? 'btn-warning'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => handleRatingChange(assignment.staff_id, star)}
                        >
                          <i className="bi bi-star-fill"></i> {star}
                        </button>
                      ))}
                    </div>
                    <small className="text-muted d-block mt-2">
                      現在の評価: {ratings[assignment.staff_id]?.rating || 0} / 5
                    </small>
                  </div>
                  
                  {/* コメント */}
                  <div className="mb-3">
                    <label className="form-label">コメント（任意）</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="良かった点や改善点などをご記入ください"
                      value={ratings[assignment.staff_id]?.comment || ''}
                      onChange={(e) => handleCommentChange(assignment.staff_id, e.target.value)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ボタン */}
        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.back()}
            disabled={submitting}
          >
            <i className="bi bi-arrow-left me-2"></i>
            戻る
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || assignments.length === 0}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                送信中...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                評価を送信
              </>
            )}
          </button>
        </div>
      </form>
    </>
  )
}

