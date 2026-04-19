import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { CharactersGrid } from './components/CharactersGrid'
import { NotFoundPage } from './pages/NotFoundPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/characters" replace />} />
        <Route path="characters" element={<CharactersGrid />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
