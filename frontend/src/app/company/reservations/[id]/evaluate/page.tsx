'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/lib/auth/AuthContext'
import { reservationsApi, assignmentsApi, ratingsApi, Reservation, Assignment, RatingCreate } from '@/lib/api'

interface StaffRatingForm {
  staff_id: number;
  staff_name: string;
  assignment_id?: number;
  cleanliness: number;
  responsiveness: number;
  satisfaction: number;
  punctuality: number;
  skill: number;
  comment: string;
}

export default function CompanyEvaluatePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const reservationId = parseInt(params.id as string)

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [staffRatings, setStaffRatings] = useState<StaffRatingForm[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        const [reservationData, assignmentsData] = await Promise.all([
          reservationsApi.getById(reservationId),
          assignmentsApi.getReservationAssignments(reservationId)
        ])

        setReservation(reservationData)

        // 確定済みのアサインのみを対象
        const confirmedAssignments = assignmentsData.filter(a => a.status === 'confirmed')
        setAssignments(confirmedAssignments)

        // 各スタッフの評価フォームを初期化
        const initialRatings: StaffRatingForm[] = confirmedAssignments.map(a => ({
          staff_id: a.staff_id,
          staff_name: a.staff_name,
          assignment_id: a.id,
          cleanliness: 5,
          responsiveness: 5,
          satisfaction: 5,
          punctuality: 5,
          skill: 5,
          comment: '',
        }))
        setStaffRatings(initialRatings)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        console.error('評価データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [reservationId, user?.id])

  const handleRatingChange = (index: number, field: keyof StaffRatingForm, value: number | string) => {
    setStaffRatings(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async () => {
    if (!reservation || !user?.company_id) {
      alert('企業情報が不足しています')
      return
    }

    // 全てのスタッフに評価が入力されているか確認
    const allRated = staffRatings.every(r => r.comment.trim().length > 0)
    if (!allRated) {
      alert('全てのスタッフにコメントを入力してください')
      return
    }

    if (!confirm(`${staffRatings.length}名のスタッフを評価します。よろしいですか？`)) {
      return
    }

    try {
      setSubmitting(true)

      // 各スタッフの評価を送信
      for (const rating of staffRatings) {
        const ratingData: RatingCreate = {
          reservation_id: reservationId,
          company_id: user.company_id,
          staff_id: rating.staff_id,
          assignment_id: rating.assignment_id,
          cleanliness: rating.cleanliness,
          responsiveness: rating.responsiveness,
          satisfaction: rating.satisfaction,
          punctuality: rating.punctuality,
          skill: rating.skill,
          comment: rating.comment,
          is_public: true,
        }

        await ratingsApi.create(ratingData)
      }

      alert('評価を送信しました')
      router.push(`/company/reservations/${reservationId}`)

    } catch (err) {
      alert('評価の送信に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setSubmitting(false)
    }
  }

  const renderStarRating = (index: number, field: 'cleanliness' | 'responsiveness' | 'satisfaction' | 'punctuality' | 'skill', value: number) => {
    return (
      <div className="d-flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className="btn btn-link p-0"
            onClick={() => handleRatingChange(index, field, star)}
            style={{ fontSize: '1.5rem', textDecoration: 'none' }}
          >
            <i className={`bi bi-star${star <= value ? '-fill text-warning' : ' text-muted'}`}></i>
          </button>
        ))}
        <span className="ms-2 align-self-center">{value}</span>
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

  if (error || !reservation) {
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
          {error || '予約が見つかりませんでした'}
        </div>
      </>
    )
  }

  if (assignments.length === 0) {
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
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          この予約には確定済みのスタッフがいません
        </div>
      </>
    )
  }

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

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-info-circle me-2"></i>
            予約情報
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2"><strong>事業所:</strong> {reservation.office_name}</p>
              <p className="mb-2"><strong>日時:</strong> {reservation.reservation_date} {reservation.start_time}〜{reservation.end_time}</p>
            </div>
            <div className="col-md-6">
              <p className="mb-2"><strong>スタッフ数:</strong> {assignments.length}名</p>
            </div>
          </div>
        </div>
      </div>

      {/* 評価フォーム */}
      {staffRatings.map((rating, index) => (
        <div key={rating.staff_id} className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">
              <i className="bi bi-person-circle me-2"></i>
              {rating.staff_name}
              {assignments[index]?.slot_number && (
                <span className="badge bg-info ms-2">枠{assignments[index].slot_number}</span>
              )}
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">清潔感</label>
                {renderStarRating(index, 'cleanliness', rating.cleanliness)}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">対応力</label>
                {renderStarRating(index, 'responsiveness', rating.responsiveness)}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">満足度</label>
                {renderStarRating(index, 'satisfaction', rating.satisfaction)}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">時間厳守</label>
                {renderStarRating(index, 'punctuality', rating.punctuality)}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">技術力</label>
                {renderStarRating(index, 'skill', rating.skill)}
              </div>
              <div className="col-md-6 d-flex align-items-center">
                <div className="alert alert-info mb-0 w-100">
                  <strong>総合評価:</strong> {((rating.cleanliness + rating.responsiveness + rating.satisfaction + rating.punctuality + rating.skill) / 5).toFixed(1)}
                </div>
              </div>
              <div className="col-12">
                <label className="form-label fw-bold">コメント *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={rating.comment}
                  onChange={(e) => handleRatingChange(index, 'comment', e.target.value)}
                  placeholder="スタッフへのコメントを入力してください"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 送信ボタン */}
      <div className="d-flex gap-2 justify-content-end">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={submitting || staffRatings.some(r => !r.comment.trim())}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              送信中...
            </>
          ) : (
            <>
              <i className="bi bi-send me-2"></i>
              評価を送信
            </>
          )}
        </button>
      </div>
    </>
  )
}

