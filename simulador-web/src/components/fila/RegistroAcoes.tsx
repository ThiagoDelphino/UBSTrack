import { useSimulacao, type TipoEvento } from '../../context/simulacao'
import { formatarHora } from '../../utils/formatadores'
import { Icone, type NomeIcone } from '../ui/Icone'
import styles from './RegistroAcoes.module.css'

const ICONE: Record<TipoEvento, NomeIcone> = {
  retirada: 'mais',
  chamada: 'chamar',
  finalizacao: 'check',
  desistencia: 'desistir',
  erro: 'alerta',
}

/** Histórico das últimas ações (manuais e automáticas). Bom para mostrar o que o painel vai refletir. */
export function RegistroAcoes() {
  const { registro } = useSimulacao()

  return (
    <section className={`cartao ${styles.cartao}`} aria-labelledby="titulo-registro">
      <h2 id="titulo-registro">Últimas ações</h2>
      {registro.length === 0 ? (
        <p className={styles.vazio}>Nada por aqui ainda. As ações aparecem assim que você usar os botões.</p>
      ) : (
        <ul className={styles.lista} aria-live="polite">
          {registro.slice(0, 8).map((evento) => (
            <li key={evento.id} className={styles.item}>
              <span className={`${styles.icone} ${styles[evento.tipo]}`}>
                <Icone nome={ICONE[evento.tipo]} tamanho={14} />
              </span>
              <span className={styles.texto}>{evento.texto}</span>
              <span className={styles.meta}>
                {evento.origem === 'automatico' ? 'auto · ' : ''}
                {formatarHora(evento.hora)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
