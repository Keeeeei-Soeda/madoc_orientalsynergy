'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import { reservationsApi, ReservationCreate } from '@/lib/api'

export default function NewCompanyReservationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // TODO: 実際のログインユーザーのcompany_idを取得する
  const companyId = 1 // 仮の企業ID
  
  const [formData, setFormData] = useState<ReservationCreate>({
    company_id: companyId,
    office_name: '',
    office_address: '',
    reservation_date: '',
    start_time: '',
    end_time: '',
    max_participants: 1,
    employee_names: '',
    status: 'recruiting',
    notes: '',
    requirements: '',
  })
  
  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.office_name || !formData.reservation_date || !formData.start_time || !formData.end_time) {
      alert('必須項目を入力してください')
      return
    }
    
    try {
      setLoading(true)
      const created = await reservationsApi.create(formData)
      alert('予約を作成しました')
      router.push(`/company/reservations/${created.id}`)
    } catch (err) {
      alert('作成に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setLoading(false)
    }
  }
  
  // 入力変更ハンドラー
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  return (
    <>
      <PageHeader 
        title="新規予約" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '予約管理', href: '/company/reservations' },
          { label: '新規予約' }
        ]}
      />
      
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            {/* 実施事業所情報 */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-building me-2"></i>
                  実施事業所情報
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="office_name" className="form-label">
                      事業所名 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="office_name"
                      name="office_name"
                      className="form-control form-control-lg"
                      value={formData.office_name}
                      onChange={handleChange}
                      placeholder="例: 梅田オフィス"
                      required
                    />
                  </div>
                  
                  <div className="col-12">
                    <label htmlFor="office_address" className="form-label">
                      事業所住所 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="office_address"
                      name="office_address"
                      className="form-control"
                      value={formData.office_address}
                      onChange={handleChange}
                      placeholder="例: 大阪府大阪市北区梅田1-1-1 梅田ビル5F"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 日時設定 */}
            <div className="card mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  訪問日時
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label htmlFor="reservation_date" className="form-label">
                      訪問日 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="reservation_date"
                      name="reservation_date"
                      className="form-control form-control-lg"
                      value={formData.reservation_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="start_time" className="form-label">
                      開始時刻 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      className="form-control form-control-lg"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="end_time" className="form-label">
                      終了時刻 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      className="form-control form-control-lg"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="alert alert-info mt-3 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  予約確定後、担当スタッフが決定されます。
                </div>
              </div>
            </div>
            
            {/* 募集情報 */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-person-check me-2"></i>
                  募集情報
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="max_participants" className="form-label">
                      募集人数 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="max_participants"
                      name="max_participants"
                      className="form-control form-control-lg"
                      value={formData.max_participants}
                      onChange={handleChange}
                      min="1"
                      max="50"
                      required
                    />
                    <small className="text-muted">
                      マッサージを受ける社員の募集人数を指定してください
                    </small>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>募集人数について</strong>
                      <p className="mb-0 mt-2 small">
                        スタッフが応募するごとに空き枠が減少します。<br />
                        募集人数に達すると自動的に募集終了となります。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 対象社員 */}
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  対象社員
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="employee_names" className="form-label">
                    社員名
                  </label>
                  <input
                    type="text"
                    id="employee_names"
                    name="employee_names"
                    className="form-control"
                    value={formData.employee_names}
                    onChange={handleChange}
                    placeholder="例: 田中太郎, 鈴木次郎"
                  />
                  <small className="text-muted">
                    複数の社員がいる場合はカンマ区切りで入力してください
                  </small>
                </div>
              </div>
            </div>
            
            {/* 要望・備考 */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-chat-left-text me-2"></i>
                  要望・備考
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="requirements" className="form-label">
                    要望
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    className="form-control"
                    rows={4}
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="スタッフへの要望があればご記入ください（例: マッサージチェア使用希望、静かな個室希望など）"
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="form-label">
                    備考
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-control"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="その他、特記事項があればご記入ください"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* サイドバー */}
          <div className="col-12 col-lg-4">
            {/* 予約の流れ */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">予約の流れ</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-start mb-3">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      1
                    </div>
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">予約申込</h6>
                    <small className="text-muted">フォームから予約情報を送信</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-start mb-3">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      2
                    </div>
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">管理者確認</h6>
                    <small className="text-muted">管理者が内容を確認します</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-start mb-3">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      3
                    </div>
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">スタッフ決定</h6>
                    <small className="text-muted">担当スタッフが決定します</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      4
                    </div>
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">訪問実施</h6>
                    <small className="text-muted">スタッフが訪問します</small>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 確認事項 */}
            <div className="card mb-4 border-warning">
              <div className="card-header bg-warning bg-opacity-10">
                <h6 className="mb-0 text-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  ご確認ください
                </h6>
              </div>
              <div className="card-body">
                <ul className="small mb-0 ps-3">
                  <li className="mb-2">予約は管理者の確認が必要です</li>
                  <li className="mb-2">スタッフの都合により日程調整をお願いする場合があります</li>
                  <li className="mb-2">キャンセルは2日前までにお願いします</li>
                </ul>
              </div>
            </div>
            
            {/* 送信ボタン */}
            <div className="card">
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        送信中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        予約を申し込む
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => router.back()}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}







