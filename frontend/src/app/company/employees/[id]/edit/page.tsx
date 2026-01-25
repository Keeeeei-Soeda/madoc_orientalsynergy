'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'

// モックデータ
const employeeData = {
  id: '1',
  name: '田中一郎',
  department: '総務部',
  position: '部長',
  email: 'tanaka@company.jp',
  phone: '090-1234-5678',
  lineId: 'tanaka_line',
  notes: '',
}

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState(employeeData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '社員名は必須です'
    }

    if (!formData.department.trim()) {
      newErrors.department = '部署は必須です'
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'メールアドレスの形式が正しくありません'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: API連携実装（認証実装後）
      // await employeesApi.update(id, formData)
      
      // モック実装（成功をシミュレート）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('社員情報を更新しました')
      router.push('/company/employees')
    } catch (error) {
      console.error('社員更新エラー:', error)
      alert('社員情報の更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader 
        title="社員情報編集" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '社員管理', href: '/company/employees' },
          { label: '社員情報編集' }
        ]}
      />

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* 基本情報 */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">基本情報</h5>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label">
                    社員名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="例: 田中太郎"
                    required
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="department" className="form-label">
                    部署 <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="総務部">総務部</option>
                    <option value="人事部">人事部</option>
                    <option value="営業部">営業部</option>
                    <option value="経理部">経理部</option>
                    <option value="製造部">製造部</option>
                    <option value="技術部">技術部</option>
                    <option value="その他">その他</option>
                  </select>
                  {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="position" className="form-label">
                    役職
                  </label>
                  <select
                    className="form-select"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                  >
                    <option value="">選択してください</option>
                    <option value="部長">部長</option>
                    <option value="課長">課長</option>
                    <option value="主任">主任</option>
                    <option value="一般">一般</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="例: tanaka@company.jp"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">連絡先情報</h5>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="phone" className="form-label">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="例: 090-1234-5678"
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="lineId" className="form-label">
                    LINE ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="lineId"
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleChange}
                    placeholder="例: tanaka_line"
                  />
                  <small className="text-muted">LINE連携用のIDを入力してください</small>
                </div>
              </div>
            </div>

            {/* 備考 */}
            <div className="mb-4">
              <label htmlFor="notes" className="form-label">
                備考
              </label>
              <textarea
                className="form-control"
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="その他特記事項があれば記入してください"
              />
            </div>

            {/* ボタン */}
            <div className="d-flex gap-2 justify-content-end">
              <Link href="/company/employees" className="btn btn-secondary">
                キャンセル
              </Link>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    更新中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    更新
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






