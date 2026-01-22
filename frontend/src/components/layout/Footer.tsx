import React from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="footer">
      <p className="mb-0">© {currentYear} オリエンタルシナジー. All rights reserved.</p>
    </footer>
  )
}

