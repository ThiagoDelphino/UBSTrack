import type { EstadoConexao } from '../../hooks/useStatusApi'
import styles from './StatusApi.module.css'

const TEXTO: Record<EstadoConexao, string> = {
  carregando: 'Verificando API…',
  conectada: 'API conectada',
  indisponivel: 'API indisponível',
}

/** Bolinha + texto com o estado da API. Igual nos dois apps. */
export function StatusApi({ estado }: { estado: EstadoConexao }) {
  return (
    <span className={`${styles.selo} ${styles[estado]}`} role="status">
      <span className={styles.ponto} aria-hidden="true" />
      {TEXTO[estado]}
    </span>
  )
}
