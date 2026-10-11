import styles from './AvisoEmergencia.module.css'

/** Regra de negócio 10: aviso fixo em todas as telas do painel. */
export function AvisoEmergencia() {
  return (
    <aside className={styles.aviso} role="note">
      Estimativas não garantem atendimento. Em emergência, ligue{' '}
      <a href="tel:192">192 (SAMU)</a>.
    </aside>
  )
}
