import { Route, Routes } from 'react-router-dom'
import { NaoEncontradaPage } from './pages/NaoEncontradaPage'
import { PainelPage } from './pages/PainelPage'
import { SobrePage } from './pages/SobrePage'
import { UnidadeDetalhePage } from './pages/UnidadeDetalhePage'

/** Rotas do painel. Cada rota aponta para uma página em pages/. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PainelPage />} />
      <Route path="/unidades/:id" element={<UnidadeDetalhePage />} />
      <Route path="/sobre" element={<SobrePage />} />
      <Route path="*" element={<NaoEncontradaPage />} />
    </Routes>
  )
}
