import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  iconColor?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'warning'
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  iconColor = 'primary',
  change,
  changeType 
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon bg-${iconColor} bg-opacity-10 text-${iconColor}`}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeType}`}>
          {changeType === 'positive' && <i className="bi bi-arrow-up me-1"></i>}
          {changeType === 'negative' && <i className="bi bi-arrow-down me-1"></i>}
          {change}
        </div>
      )}
    </div>
  )
}

