'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/lib/auth/AuthContext'
import { reservationsApi, assignmentsApi, ratingsApi, Reservation, Assignment, RatingCreate } from '@/lib/api'

export default function CompanyEvaluateStaffPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const reservationId = parseInt(params.id as string)
  const assignmentId = parseInt(params.assignmentId as string)

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isEvaluated, setIsEvaluated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 評価フォーム
  const [cleanliness, setCleanliness] = useState(5)
  const [responsiveness, setResponsiveness] = useState(5)
  const [satisfaction, setSatisfaction] = useState(5)
  const [punctuality, setPunctuality] = useState(5)
  const [skill, setSkill] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        const [reservationData, assignmentData] = await Promise.all([
          reservationsApi.getById(reservationId),
          assignmentsApi.getById(assignmentId)
        ])

        // 予約の企業IDとユーザーの企業IDが一致するか確認
        if (reservationData.company_id !== user.company_id) {
          throw new Error('この予約にアクセスする権限がありません')
        }

        // アサインメントが確定済みまたは完了済みか確認
        if (assignmentData.status !== 'confirmed') {
          throw new Error('確定済みのアサインメントのみ評価できます')
        }

        // 既に評価済みかチェック
        try {
          const checkResult = await ratingsApi.checkExists(reservationId, assignmentData.staff_id)
          if (checkResult.exists) {
            setIsEvaluated(true)
            setError('このスタッフは既に評価済みです。')
          }
        } catch (err) {
          console.error('評価チェックエラー:', err)
          // チェックエラーは無視（評価可能として扱う）
        }

        setReservation(reservationData)
        setAssignment(assignmentData)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        console.error('評価データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [reservationId, assignmentId, user?.id, user?.company_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 既に評価済みの場合はアラートを表示して処理を中断
    if (isEvaluated) {
      alert('このスタッフは既に評価済みです。')
      router.push(`/company/reservations/${reservationId}`)
      return
    }

    if (!reservation || !assignment || !user?.company_id) {
      alert('企業情報が不足しています')
      return
    }

    if (!comment.trim()) {
      alert('コメントを入力してください')
      return
    }

    if (!confirm(`${assignment.staff_name}さんを評価します。よろしいですか？`)) {
      return
    }

    try {
      setSubmitting(true)

      const ratingData: RatingCreate = {
        company_id: user.company_id,
        staff_id: assignment.staff_id,
        reservation_id: reservation.id,
        assignment_id: assignment.id,
        cleanliness,
        responsiveness,
        satisfaction,
        punctuality,
        skill,
        comment: comment.trim(),
      }

      await ratingsApi.create(ratingData)

      alert('評価を送信しました')
      router.push(`/company/reservations/${reservationId}`)

    } catch (err) {
      alert(err instanceof Error ? err.message : '評価の送信に失敗しました')
      console.error('評価送信エラー:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStarRating = (
    label: string,
    value: number,
    onChange: (value: number) => void
  ) => {
    return (
      <div className="mb-4">
        <label className="form-label fw-bold">{label}</label>
        <div className="d-flex align-items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => onChange(star)}
              style={{ fontSize: '2rem' }}
              disabled={isEvaluated}
            >
              {star <= value ? (
                <i className="bi bi-star-fill text-warning"></i>
              ) : (
                <i className="bi bi-star text-muted"></i>
              )}
            </button>
          ))}
          <span className="badge bg-primary ms-2">{value}</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader 
          title="スタッフ評価" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約管理', href: '/company/reservations' },
            { label: '予約詳細', href: `/company/reservations/${reservationId}` },
            { label: 'スタッフ評価' }
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

  if (error || !reservation || !assignment) {
    return (
      <>
        <PageHeader 
          title="スタッフ評価" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約管理', href: '/company/reservations' },
            { label: 'スタッフ評価' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'データが見つかりませんでした'}
        </div>
      </>
    )
  }

  const timeSlots = (reservation.time_slots || []) as any[]
  const slot = timeSlots.find(s => s.slot === assignment.slot_number)

  const totalScore = cleanliness + responsiveness + satisfaction + punctuality + skill
  const averageScore = (totalScore / 5).toFixed(1)

  return (
    <>
      <PageHeader 
        title="スタッフ評価" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '予約管理', href: '/company/reservations' },
          { label: '予約詳細', href: `/company/reservations/${reservationId}` },
          { label: 'スタッフ評価' }
        ]}
      />

      <div className="row g-4">
        {/* 予約情報 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                予約情報
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted">事業所</label>
                  <p className="mb-0 fw-bold">{reservation.office_name}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">住所</label>
                  <p className="mb-0">{reservation.office_address}</p>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted">訪問日</label>
                  <p className="mb-0 fw-bold">
                    <i className="bi bi-calendar3 me-2"></i>
                    {reservation.reservation_date}
                  </p>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted">時間</label>
                  <p className="mb-0 fw-bold">
                    <i className="bi bi-clock me-2"></i>
                    {slot ? `${slot.start_time} 〜 ${slot.end_time}` : '-'}
                  </p>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted">枠番号</label>
                  <p className="mb-0">
                    <span className="badge bg-primary">枠 {assignment.slot_number}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* スタッフ情報 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                評価対象スタッフ
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-circle fs-1 me-3 text-secondary"></i>
                <div>
                  <h4 className="mb-0">{assignment.staff_name}</h4>
                  <p className="text-muted mb-0">スタッフID: {assignment.staff_id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 評価フォーム */}
        <div className="col-12">
          {isEvaluated && (
            <div className="alert alert-warning mb-4" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>このスタッフは既に評価済みです。</strong>
              <br />
              評価済みのスタッフに対して再度評価を登録することはできません。
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-star me-2"></i>
                  評価入力
                </h5>
                {isEvaluated && (
                  <span className="badge bg-success ms-2">
                    <i className="bi bi-check-circle me-1"></i>
                    評価済み
                  </span>
                )}
              </div>
              <div className="card-body" style={isEvaluated ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
                {renderStarRating('清潔感', cleanliness, setCleanliness)}
                {renderStarRating('適度', responsiveness, setResponsiveness)}
                {renderStarRating('満足度', satisfaction, setSatisfaction)}
                {renderStarRating('時間厳守', punctuality, setPunctuality)}
                {renderStarRating('技術力', skill, setSkill)}

                <div className="alert alert-info">
                  <strong>総合評価: {averageScore}</strong>
                  <div className="mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi ${
                          star <= Math.round(parseFloat(averageScore))
                            ? 'bi-star-fill text-warning'
                            : 'bi-star text-muted'
                        } fs-4`}
                      ></i>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    コメント <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="スタッフの対応や技術について、具体的なコメントを入力してください"
                    required
                    disabled={isEvaluated}
                  />
                  <small className="text-muted">
                    {comment.length} 文字
                  </small>
                </div>
              </div>
              <div className="card-footer d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  戻る
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !comment.trim() || isEvaluated}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
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
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

