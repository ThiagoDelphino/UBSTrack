import { Icone } from '../ui/Icone'
import styles from './AvisoEmergencia.module.css'

/** Regra de negócio 10: aviso fixo em todas as telas do painel. */
export function AvisoEmergencia() {
  return (
    <aside className={styles.aviso} role="note">
      <Icone nome="telefone" tamanho={18} />
      <p>
        <strong>Estimativas não garantem atendimento.</strong> Em emergência, ligue{' '}
        <a href="tel:192">192 (SAMU)</a>.
      </p>
    </aside>
  )
}
