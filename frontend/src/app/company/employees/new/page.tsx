'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { employeesApi, companiesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function NewEmployeePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
    email: '',
    phone: '',
    line_id: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 企業IDを取得
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (user) {
          const companies = await companiesApi.getAll()
          // 現在のユーザーに紐づく企業を取得
          const userCompany = companies.find(c => c.user_id === user.id)
          if (userCompany) {
            setCompanyId(userCompany.id)
          }
        }
      } catch (err) {
        console.error('企業取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [user])

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

    if (!formData.department || !formData.department.trim()) {
      newErrors.department = '部署を選択してください'
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

    if (!companyId) {
      alert('企業情報が取得できませんでした')
      return
    }

    setIsSubmitting(true)

    try {
      // 空文字列をnullに変換
      const submitData = {
        company_id: companyId,
        name: formData.name,
        department: formData.department,
        position: formData.position || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        line_id: formData.line_id || undefined,
        notes: formData.notes || undefined,
      }
      
      console.log('送信データ:', submitData)
      
      await employeesApi.create(submitData)
      
      alert('社員を登録しました')
      
      // returnToパラメータがあればそのページに、なければ社員一覧に遷移
      if (returnTo) {
        // 元のページに戻る前に、サーバーから最新データを取得
        router.push(returnTo)
        // ページ遷移後にデータを強制的に再取得
        setTimeout(() => {
          router.refresh()
        }, 100)
      } else {
        router.push('/company/employees')
      }
    } catch (error: any) {
      console.error('社員登録エラー:', error)
      
      // エラーの詳細を表示
      let errorMessage = '社員の登録に失敗しました'
      if (error.data && error.data.detail) {
        if (typeof error.data.detail === 'string') {
          errorMessage += ': ' + error.data.detail
        } else if (Array.isArray(error.data.detail)) {
          // Pydanticのバリデーションエラーの場合
          const messages = error.data.detail.map((err: any) => 
            `${err.loc.join('.')}: ${err.msg}`
          ).join('\n')
          errorMessage += ':\n' + messages
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader 
        title="社員登録" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '社員管理', href: '/company/employees' },
          { label: '社員登録' }
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
                  <label htmlFor="line_id" className="form-label">
                    LINE ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="line_id"
                    name="line_id"
                    value={formData.line_id}
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
              <Link 
                href={returnTo || '/company/employees'} 
                className="btn btn-secondary"
              >
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
                    登録中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    登録
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




