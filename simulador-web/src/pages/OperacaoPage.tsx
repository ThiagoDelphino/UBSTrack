import { useStatusApi } from '../hooks/useStatusApi'

const TEXTO_STATUS = {
  carregando: 'verificando…',
  conectada: 'conectada',
  indisponivel: 'indisponível',
} as const

/** Tela do operador: escolher a unidade e operar a fila. */
export function OperacaoPage() {
  const statusApi = useStatusApi()

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h1>UBSTrack — Simulador</h1>
      <p>API do simulador: {TEXTO_STATUS[statusApi]}</p>
      {/* Próximos passos: <SeletorUnidade />, <ControlesFila />, <ListaSenhas /> */}
    </main>
  )
}
