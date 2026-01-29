import React from 'react'
import Navbar from '../components/Navbar'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
const Layout = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
<Navbar/>
<main style={{ flex: 1 }}>
<Outlet/>
</main>
<Footer/>
    </div>
  )
}

export default Layout
