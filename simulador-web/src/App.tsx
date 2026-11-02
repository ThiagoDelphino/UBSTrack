import { Route, Routes } from 'react-router-dom'
import { NaoEncontradaPage } from './pages/NaoEncontradaPage'
import { OperacaoPage } from './pages/OperacaoPage'

/** Rotas do simulador. Cada rota aponta para uma página em pages/. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OperacaoPage />} />
      {/* Próximas: /painel-chamada e /visao-geral */}
      <Route path="*" element={<NaoEncontradaPage />} />
    </Routes>
  )
}
