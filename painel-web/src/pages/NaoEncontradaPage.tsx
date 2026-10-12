import { Link } from 'react-router-dom'

export function NaoEncontradaPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Página não encontrada</h1>
      <Link to="/">Voltar ao início</Link>
    </main>
  )
}
