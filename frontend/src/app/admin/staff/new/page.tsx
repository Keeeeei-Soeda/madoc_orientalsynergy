'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import { staffApi } from '@/lib/api'

export default function NewStaffPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // ユーザーアカウント情報
    email: '',
    password: '',
    // スタッフ情報
    name: '',
    phone: '',
    address: '',
    bank_account: '',
    qualifications: '',
    available_days: '',
    line_id: '',
    is_available: true,
    rating: 0,
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. まずユーザーアカウントを作成
      const userResponse = await fetch('http://localhost:8000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('access_token=')[1]?.split(';')[0]}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
          role: 'STAFF'
        })
      })

      if (!userResponse.ok) {
        throw new Error('ユーザーアカウントの作成に失敗しました')
      }

      const user = await userResponse.json()

      // 2. 作成されたユーザーIDを使ってスタッフを作成
      const staffData = {
        user_id: user.id,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        bank_account: formData.bank_account,
        qualifications: formData.qualifications,
        available_days: formData.available_days,
        line_id: formData.line_id,
        is_available: formData.is_available,
        rating: formData.rating,
        notes: formData.notes,
      }

      await staffApi.create(staffData)
      alert('スタッフを登録しました')
      router.push('/admin/staff')
    } catch (err: any) {
      setError(err.message || 'スタッフの登録に失敗しました')
      console.error('スタッフ登録エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="スタッフを追加"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: 'スタッフ管理', href: '/admin/staff' },
          { label: '新規登録' }
        ]}
      />

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* アカウント情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">アカウント情報</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="email" className="form-label">
                      メールアドレス <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">ログイン時に使用します</small>
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="password" className="form-label">
                      パスワード <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                    />
                    <small className="text-muted">8文字以上で設定してください</small>
                  </div>
                </div>
              </div>
            </div>

            {/* 基本情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">基本情報</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="name" className="form-label">
                      氏名 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="phone" className="form-label">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="090-1234-5678"
                    />
                  </div>

                  <div className="col-12">
                    <label htmlFor="address" className="form-label">
                      住所
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      className="form-control"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="line_id" className="form-label">
                      LINE ID
                    </label>
                    <input
                      type="text"
                      id="line_id"
                      name="line_id"
                      className="form-control"
                      value={formData.line_id}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="bank_account" className="form-label">
                      銀行口座
                    </label>
                    <input
                      type="text"
                      id="bank_account"
                      name="bank_account"
                      className="form-control"
                      value={formData.bank_account}
                      onChange={handleChange}
                      placeholder="〇〇銀行 △△支店 普通 1234567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 資格・稼働情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">資格・稼働情報</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="qualifications" className="form-label">
                      資格
                    </label>
                    <input
                      type="text"
                      id="qualifications"
                      name="qualifications"
                      className="form-control"
                      value={formData.qualifications}
                      onChange={handleChange}
                      placeholder="あん摩マッサージ指圧師、鍼灸師など"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="available_days" className="form-label">
                      稼働可能曜日
                    </label>
                    <input
                      type="text"
                      id="available_days"
                      name="available_days"
                      className="form-control"
                      value={formData.available_days}
                      onChange={handleChange}
                      placeholder="月,火,水,木,金"
                    />
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="is_available"
                        name="is_available"
                        className="form-check-input"
                        checked={formData.is_available}
                        onChange={handleChange}
                      />
                      <label htmlFor="is_available" className="form-check-label">
                        稼働可能
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label htmlFor="notes" className="form-label">
                      備考
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                戻る
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    登録中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    登録する
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

