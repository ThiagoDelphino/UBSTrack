import type { Situacao } from '../../types/unidade'
import styles from './SeloSituacao.module.css'

const TEXTO: Record<Situacao, string> = {
  baixa: 'Fila baixa',
  moderada: 'Fila moderada',
  alta: 'Fila alta',
}

/** Selo colorido da situação da fila (regra 5). A cor nunca vai sozinha: sempre tem o texto. */
export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  return (
    <span className={`${styles.selo} ${styles[situacao]}`}>
      <span className={styles.ponto} aria-hidden="true" />
      {TEXTO[situacao]}
    </span>
  )
}
