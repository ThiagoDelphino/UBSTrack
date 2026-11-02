import { Route, Routes } from 'react-router-dom'
import { NaoEncontradaPage } from './pages/NaoEncontradaPage'
import { PainelPage } from './pages/PainelPage'

/** Rotas do painel. Cada rota aponta para uma página em pages/. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PainelPage />} />
      {/* Próximas: /unidades/:id (detalhe) e /sobre */}
      <Route path="*" element={<NaoEncontradaPage />} />
    </Routes>
  )
}
