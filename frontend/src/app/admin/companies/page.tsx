'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { companiesApi, Company } from '@/lib/api'

// IDを6桁のゼロパディングで表示する関数
const formatCompanyId = (id: number): string => {
  return id.toString().padStart(6, '0')
}

// 契約期間が終了しているかチェックする関数
const isContractExpired = (endDate: string): boolean => {
  if (!endDate) return false
  try {
    const [year, month, day] = endDate.split('/').map(Number)
    const contractEndDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return contractEndDate < today
  } catch (error) {
    return false
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // データ取得
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        const data = await companiesApi.getAll()
        setCompanies(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '企業データの取得に失敗しました')
        console.error('企業データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCompanies()
  }, [])
  
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader 
          title="企業管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: '企業管理' }
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
          title="企業管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: '企業管理' }
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
        title="企業管理" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: '企業管理' }
        ]}
        action={
          <Link href="/admin/companies/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            企業を追加
          </Link>
        }
      />
      
      {/* 検索・フィルター */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="search-bar">
                <i className="bi bi-search search-icon"></i>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="企業名で検索..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 企業一覧テーブル */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">企業一覧 ({filteredCompanies.length}件)</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>企業名</th>
                  <th>代表者名</th>
                  <th>電話番号</th>
                  <th>契約期間</th>
                  <th>ステータス</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td className="fw-bold">{company.company_name}</td>
                    <td>{company.representative_name}</td>
                    <td>{company.phone}</td>
                    <td>
                      {company.contract_start_date}
                      {company.contract_end_date && ` 〜 ${company.contract_end_date}`}
                    </td>
                    <td>
                      <span className="badge bg-success">
                        有効
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link href={`/admin/companies/${company.id}`} className="btn btn-outline-primary">
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link href={`/admin/companies/${company.id}/edit`} className="btn btn-outline-secondary">
                          <i className="bi bi-pencil"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

