'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">Oriental Synergy</h1>
          <p className="lead text-muted">派遣業務管理システム</p>
        </div>
        
        <div className="row g-4 justify-content-center">
          {/* 管理画面 */}
          <div className="col-12 col-md-4">
            <Link href="/admin/dashboard" className="text-decoration-none">
              <div className="card border-admin border-3 h-100 shadow-sm hover-shadow transition">
                <div className="card-body text-center p-5">
                  <div className="mb-4">
                    <i className="bi bi-shield-lock fs-1 text-admin"></i>
                  </div>
                  <h3 className="card-title text-admin mb-3">管理画面</h3>
                  <p className="card-text text-muted">
                    システム全体の管理・監視
                  </p>
                  <ul className="list-unstyled text-start mt-3">
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      全データ管理
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      企業・スタッフ管理
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      予約・勤怠管理
                    </li>
                  </ul>
                </div>
              </div>
            </Link>
          </div>
          
          {/* 企業側 */}
          <div className="col-12 col-md-4">
            <Link href="/company/dashboard" className="text-decoration-none">
              <div className="card border-company border-3 h-100 shadow-sm hover-shadow transition">
                <div className="card-body text-center p-5">
                  <div className="mb-4">
                    <i className="bi bi-building fs-1 text-company"></i>
                  </div>
                  <h3 className="card-title text-company mb-3">企業側</h3>
                  <p className="card-text text-muted">
                    顧客企業向けポータル
                  </p>
                  <ul className="list-unstyled text-start mt-3">
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      予約管理
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      社員管理
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      評価入力
                    </li>
                  </ul>
                </div>
              </div>
            </Link>
          </div>
          
          {/* スタッフ側 */}
          <div className="col-12 col-md-4">
            <Link href="/staff/dashboard" className="text-decoration-none">
              <div className="card border-staff border-3 h-100 shadow-sm hover-shadow transition">
                <div className="card-body text-center p-5">
                  <div className="mb-4">
                    <i className="bi bi-person-badge fs-1 text-staff"></i>
                  </div>
                  <h3 className="card-title text-staff mb-3">スタッフ側</h3>
                  <p className="card-text text-muted">
                    登録スタッフ向けポータル
                  </p>
                  <ul className="list-unstyled text-start mt-3">
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      業務応募
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      シフト管理
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      評価確認
                    </li>
                  </ul>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        <div className="text-center mt-5">
          <Link href="/login" className="btn btn-primary btn-lg">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            ログイン
          </Link>
          <p className="text-muted small mt-3">
            各ポータルにアクセスするには、ログインが必要です
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .transition {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  )
}

