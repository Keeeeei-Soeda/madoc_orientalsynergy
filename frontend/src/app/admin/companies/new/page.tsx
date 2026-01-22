'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'

export default function NewCompanyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    office_name: '',
    industry: '',
    plan: '6ヶ月',
    contract_start_date: '',
    contract_end_date: '',
    usage_count: 0,
    representative: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 契約終了日を計算する関数
  const calculateContractEndDate = (startDate: string, plan: string): string => {
    if (!startDate) return ''
    
    try {
      // YYYY/MM/DD形式をパース
      const [year, month, day] = startDate.split('/').map(Number)
      if (!year || !month || !day) return ''
      
      // 契約開始日の次の月の1日を取得
      let actualStartMonth = month + 1
      let actualStartYear = year
      if (actualStartMonth > 12) {
        actualStartMonth = 1
        actualStartYear += 1
      }
      
      // プランに応じて契約終了日を計算
      let endMonth = actualStartMonth
      let endYear = actualStartYear
      
      if (plan === '6ヶ月') {
        endMonth += 5 // 6ヶ月後の月
      } else if (plan === '1年') {
        endMonth += 11 // 1年後の月
      }
      
      // 年をまたぐ場合の調整
      while (endMonth > 12) {
        endMonth -= 12
        endYear += 1
      }
      
      // その月の末日を取得
      const lastDay = new Date(endYear, endMonth, 0).getDate()
      
      return `${endYear}/${String(endMonth).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`
    } catch (error) {
      return ''
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    let newFormData = {
      ...formData,
      [name]: value
    }
    
    // 契約開始日またはプランが変更された場合、契約終了日を自動計算
    if (name === 'contract_start_date' || name === 'plan') {
      const startDate = name === 'contract_start_date' ? value : formData.contract_start_date
      const plan = name === 'plan' ? value : formData.plan
      newFormData.contract_end_date = calculateContractEndDate(startDate, plan)
    }
    
    setFormData(newFormData)
    
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
      newErrors.name = '企業名は必須です'
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'メールアドレスの形式が正しくありません'
    }

    if (formData.contact_email && !formData.contact_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.contact_email = 'メールアドレスの形式が正しくありません'
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
      // await companiesApi.create(formData)
      
      // モック実装（成功をシミュレート）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('企業を登録しました')
      router.push('/admin/companies')
    } catch (error) {
      console.error('企業登録エラー:', error)
      alert('企業の登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader 
        title="企業登録" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: '企業管理', href: '/admin/companies' },
          { label: '企業登録' }
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
                    企業名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="例: 株式会社サンプル"
                    required
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="office_name" className="form-label">
                    支店・営業所名
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="office_name"
                    name="office_name"
                    value={formData.office_name}
                    onChange={handleChange}
                    placeholder="例: 梅田営業所"
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="industry" className="form-label">
                    業種
                  </label>
                  <select
                    className="form-select"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                  >
                    <option value="">選択してください</option>
                    <option value="建設業">建設業</option>
                    <option value="製造業">製造業</option>
                    <option value="サービス業">サービス業</option>
                    <option value="IT・通信業">IT・通信業</option>
                    <option value="小売業">小売業</option>
                    <option value="卸売業">卸売業</option>
                    <option value="金融・保険業">金融・保険業</option>
                    <option value="医療・福祉">医療・福祉</option>
                    <option value="教育">教育</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="representative" className="form-label">
                    代表者名
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="representative"
                    name="representative"
                    value={formData.representative}
                    onChange={handleChange}
                    placeholder="例: 田中一郎"
                  />
                </div>
              </div>
            </div>

            {/* 契約情報 */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">契約情報</h5>
              
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="plan" className="form-label">
                    プラン <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="plan"
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    required
                  >
                    <option value="6ヶ月">6ヶ月</option>
                    <option value="1年">1年</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="contract_start_date" className="form-label">
                    契約開始日 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contract_start_date"
                    name="contract_start_date"
                    value={formData.contract_start_date}
                    onChange={handleChange}
                    placeholder="YYYY/MM/DD (例: 2024/01/15)"
                    required
                  />
                  <small className="text-muted">実際の開始は翌月1日からです</small>
                </div>

                <div className="col-md-4">
                  <label htmlFor="contract_end_date" className="form-label">
                    契約終了日
                  </label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    id="contract_end_date"
                    name="contract_end_date"
                    value={formData.contract_end_date}
                    readOnly
                    placeholder="自動計算"
                  />
                  <small className="text-muted">契約開始日とプランから自動計算</small>
                </div>

                <div className="col-md-12">
                  <label htmlFor="usage_count" className="form-label">
                    利用回数
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="usage_count"
                    name="usage_count"
                    value={formData.usage_count}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">連絡先情報</h5>
              
              <div className="row g-3">
                <div className="col-md-12">
                  <label htmlFor="address" className="form-label">
                    住所
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="例: 大阪府大阪市北区梅田1-1-1"
                  />
                </div>

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
                    placeholder="例: 06-0000-0001"
                  />
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
                    placeholder="例: info@company.jp"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
              </div>
            </div>

            {/* 担当者情報 */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">担当者情報</h5>
              
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="contact_person" className="form-label">
                    担当者名
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="例: 担当 太郎"
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="contact_phone" className="form-label">
                    担当者電話番号
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="例: 090-0000-0001"
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="contact_email" className="form-label">
                    担当者メールアドレス
                  </label>
                  <input
                    type="email"
                    className={`form-control ${errors.contact_email ? 'is-invalid' : ''}`}
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="例: tantou@company.jp"
                  />
                  {errors.contact_email && <div className="invalid-feedback">{errors.contact_email}</div>}
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
              <Link href="/admin/companies" className="btn btn-secondary">
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

