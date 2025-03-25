import Logout from '@/components/logout/page'
import React from 'react'
import SalesAnalysis from '@/components/salesanalysis/page'

const Admin = () => {
  return (
    <div>
      <h1 className='text-4xl text-blue-700'>This Admin Page</h1>
      <SalesAnalysis />
      <Logout />
    </div>
  )
}

export default Admin
