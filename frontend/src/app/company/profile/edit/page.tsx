'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import { companiesApi, Company } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function CompanyProfileEditPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    office_name: '',
    industry: '',
    representative: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    contact_person: '',
    contact_department: '',
    contact_phone: '',
    contact_fax: '',
    contact_email: '',
    notes: '',
  })
  
  // 現在の企業情報を取得
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // 企業情報を取得（user.idが企業IDと仮定）
        const companyData = await companiesApi.getById(user.id)
        
        setFormData({
          name: companyData.name || '',
          office_name: companyData.office_name || '',
          industry: companyData.industry || '',
          representative: companyData.representative || '',
          address: companyData.address || '',
          phone: companyData.phone || '',
          fax: companyData.fax || '',
          email: companyData.email || '',
          contact_person: companyData.contact_person || '',
          contact_department: companyData.contact_department || '',
          contact_phone: companyData.contact_phone || '',
          contact_fax: companyData.contact_fax || '',
          contact_email: companyData.contact_email || '',
          notes: companyData.notes || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : '企業情報の取得に失敗しました')
        console.error('企業情報取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCompanyInfo()
  }, [user?.id])
  
  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      alert('ユーザー情報が取得できません')
      return
    }
    
    if (!formData.name) {
      alert('企業名を入力してください')
      return
    }
    
    try {
      setSaving(true)
      await companiesApi.update(user.id, formData)
      alert('企業情報を更新しました')
      router.push('/company/profile')
    } catch (err) {
      alert('更新に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setSaving(false)
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
  
  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader 
          title="企業情報編集"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '企業情報管理', href: '/company/profile' },
            { label: '編集' }
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
  if (error) {
    return (
      <>
        <PageHeader 
          title="企業情報編集"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '企業情報管理', href: '/company/profile' },
            { label: '編集' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </>
    )
  }
  
  return (
    <>
      <PageHeader 
        title="企業情報編集"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '企業情報管理', href: '/company/profile' },
          { label: '編集' }
        ]}
      />
      
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* 基本情報 */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">基本情報</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="name" className="form-label required">
                      企業名
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
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
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="industry" className="form-label">
                      業種
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="例: 建設業"
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="representative" className="form-label">
                      代表者
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="representative"
                      name="representative"
                      value={formData.representative}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-12">
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
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
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
                      placeholder="06-0000-0000"
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="fax" className="form-label">
                      FAX
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="fax"
                      name="fax"
                      value={formData.fax}
                      onChange={handleChange}
                      placeholder="06-0000-0000"
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="email" className="form-label">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 担当者情報 */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">担当者情報</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
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
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="contact_department" className="form-label">
                      部署
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="contact_department"
                      name="contact_department"
                      value={formData.contact_department}
                      onChange={handleChange}
                      placeholder="例: 総務部"
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
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
                      placeholder="090-0000-0000"
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="contact_fax" className="form-label">
                      担当者FAX
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="contact_fax"
                      name="contact_fax"
                      value={formData.contact_fax}
                      onChange={handleChange}
                      placeholder="06-0000-0000"
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="contact_email" className="form-label">
                      担当者メールアドレス
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="contact_email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 備考 */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">備考</h5>
              </div>
              <div className="card-body">
                <textarea
                  className="form-control"
                  id="notes"
                  name="notes"
                  rows={5}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="その他の情報（例: 日曜定休）"
                />
              </div>
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="col-12">
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push('/company/profile')}
                disabled={saving}
              >
                <i className="bi bi-x-circle me-2"></i>
                キャンセル
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
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
          </div>
        </div>
      </form>
      
      <style jsx global>{`
        .required::after {
          content: " *";
          color: #dc3545;
        }
      `}</style>
    </>
  )
}

