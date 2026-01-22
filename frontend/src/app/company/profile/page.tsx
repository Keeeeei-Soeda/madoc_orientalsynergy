'use client'

import React from 'react'
import PageHeader from '@/components/common/PageHeader'
import Link from 'next/link'

// モックデータ
const companyData = {
  id: '000000',
  name: '株式会社サンプル',
  industry: '建設業',
  representative: '田中一郎',
  address: '大阪府大阪市なにわ区',
  phone: '00-000-0000',
  fax: '00-000-0000',
  email: 'info@aaaa.net',
  contactPerson: '担当次郎',
  department: '総務部',
  contactPhone: '090-000-0000',
  contactFax: '00-000-0000',
  contactEmail: 'soumu@aaaa.net',
  notes: '日曜定休',
  usageCount: 10,
  contractPlan: 'Aプラン',
  contractPeriod: '2025/1~2025/6',
  totalAmount: '1,000,000円',
}

const offices = [
  { id: '1', name: '梅田営業所', address: '大阪市北区', manager: '梅田一郎', phone: '06-000-0000', fax: '06-000-0000', email: 'umeda@aa.net' },
]

export default function CompanyProfilePage() {
  return (
    <>
      <PageHeader 
        title="企業情報管理"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '企業情報管理' }
        ]}
        action={
          <Link href="/company/profile/edit" className="btn btn-primary">
            <i className="bi bi-pencil me-2"></i>
            編集
          </Link>
        }
      />
      
      <div className="row g-4">
        {/* 基本情報 */}
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">基本情報</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <th style={{ width: '40%' }}>ID</th>
                    <td>{companyData.id}</td>
                  </tr>
                  <tr>
                    <th>企業名</th>
                    <td>{companyData.name}</td>
                  </tr>
                  <tr>
                    <th>業種</th>
                    <td>{companyData.industry}</td>
                  </tr>
                  <tr>
                    <th>代表者</th>
                    <td>{companyData.representative}</td>
                  </tr>
                  <tr>
                    <th>住所</th>
                    <td>
                      {companyData.address}
                      <div className="mt-2">
                        <a href="https://www.google.co.jp/maps/?q" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-geo-alt me-1"></i>
                          マップで見る
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>TEL</th>
                    <td>{companyData.phone}</td>
                  </tr>
                  <tr>
                    <th>FAX</th>
                    <td>{companyData.fax}</td>
                  </tr>
                  <tr>
                    <th>Mail</th>
                    <td><a href={`mailto:${companyData.email}`}>{companyData.email}</a></td>
                  </tr>
                  <tr>
                    <th>担当者</th>
                    <td>{companyData.contactPerson}</td>
                  </tr>
                  <tr>
                    <th>部署</th>
                    <td>{companyData.department}</td>
                  </tr>
                  <tr>
                    <th>担当者TEL</th>
                    <td>{companyData.contactPhone}</td>
                  </tr>
                  <tr>
                    <th>担当者FAX</th>
                    <td>{companyData.contactFax}</td>
                  </tr>
                  <tr>
                    <th>担当者Mail</th>
                    <td><a href={`mailto:${companyData.contactEmail}`}>{companyData.contactEmail}</a></td>
                  </tr>
                  <tr>
                    <th>備考</th>
                    <td>{companyData.notes}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* 利用状況 */}
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">利用状況</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <th style={{ width: '40%' }}>利用回数</th>
                    <td><span className="fs-4 fw-bold text-primary">{companyData.usageCount}回</span></td>
                  </tr>
                  <tr>
                    <th>契約プラン</th>
                    <td><span className="badge bg-primary">{companyData.contractPlan}</span></td>
                  </tr>
                  <tr>
                    <th>契約期間</th>
                    <td>{companyData.contractPeriod}</td>
                  </tr>
                  <tr>
                    <th>累計金額</th>
                    <td><span className="fs-5 fw-bold text-success">{companyData.totalAmount}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* 事業所情報 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">事業所情報</h5>
              <button className="btn btn-sm btn-primary">
                <i className="bi bi-plus-circle me-2"></i>
                事業所を追加
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>事業所名</th>
                      <th>事業所住所</th>
                      <th>担当者</th>
                      <th>TEL</th>
                      <th>FAX</th>
                      <th>Mail</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {offices.map((office) => (
                      <tr key={office.id}>
                        <td className="fw-bold">{office.name}</td>
                        <td>
                          <a href="https://www.google.co.jp/maps/?q" target="_blank" rel="noopener noreferrer">
                            {office.address}
                          </a>
                        </td>
                        <td>{office.manager}</td>
                        <td>{office.phone}</td>
                        <td>{office.fax}</td>
                        <td>{office.email}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">
                            <i className="bi bi-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

