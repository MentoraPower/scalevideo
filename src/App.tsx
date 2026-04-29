import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import AdminProjectPage from './pages/AdminProjectPage'
import UploadPage from './pages/UploadPage'
import ViewPage from './pages/ViewPage'
import { UploadProvider } from './lib/UploadContext'
import UploadDock from './components/UploadDock'
import './App.css'

export default function App() {
  return (
    <UploadProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/:slug" element={<AdminProjectPage />} />
          <Route path="/upload/:slug" element={<UploadPage />} />
          <Route path="/view/:slug" element={<ViewPage />} />
        </Routes>
        <UploadDock />
      </BrowserRouter>
    </UploadProvider>
  )
}
