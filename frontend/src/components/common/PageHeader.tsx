import React from 'react'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  action?: React.ReactNode
}

export default function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="page-header d-flex justify-content-between align-items-center">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              {breadcrumbs.map((item, index) => (
                <li 
                  key={index} 
                  className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                  aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                >
                  {item.href && index !== breadcrumbs.length - 1 ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1>{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

