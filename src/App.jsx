import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './Pages/LandingPage'
import Dashboard from './Pages/Dashboard/Dashboard'
import Login from './Pages/Dashboard/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App