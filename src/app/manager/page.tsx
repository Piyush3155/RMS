import Dashboard from '@/components/dashboard/page'
import Header from '@/components/header/page'
import React from 'react'

const manager = () => {
  return (
    <div>
      <Header />
      <h1 className='text-4xl text-blue-700'>Superadmin Page</h1>
      <Dashboard/>
    </div>
  )
}

export default manager
