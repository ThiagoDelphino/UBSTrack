import { Route, Routes } from 'react-router-dom'
import { NaoEncontradaPage } from './pages/NaoEncontradaPage'
import { OperacaoPage } from './pages/OperacaoPage'
import { PainelChamadaPage } from './pages/PainelChamadaPage'
import { VisaoGeralPage } from './pages/VisaoGeralPage'

/** Rotas do simulador. Cada rota aponta para uma página em pages/. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OperacaoPage />} />
      <Route path="/visao-geral" element={<VisaoGeralPage />} />
      <Route path="/painel-chamada" element={<PainelChamadaPage />} />
      <Route path="*" element={<NaoEncontradaPage />} />
    </Routes>
  )
}
