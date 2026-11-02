import { AvisoEmergencia } from '../components/layout/AvisoEmergencia'
import { useStatusApi } from '../hooks/useStatusApi'

const TEXTO_STATUS = {
  carregando: 'verificando…',
  conectada: 'conectada',
  indisponivel: 'indisponível',
} as const

/** Tela principal: lista de unidades ordenadas por tempo total estimado. */
export function PainelPage() {
  const statusApi = useStatusApi()

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h1>UBSTrack</h1>
      <p>API do painel: {TEXTO_STATUS[statusApi]}</p>
      {/* Próximo passo: <ListaUnidades /> usando o hook useUnidades */}
      <AvisoEmergencia />
    </main>
  )
}
