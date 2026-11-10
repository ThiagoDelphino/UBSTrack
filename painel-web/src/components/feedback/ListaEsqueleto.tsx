import styles from './Feedback.module.css'

/** Esqueleto de carregamento no formato dos cartões de unidade. */
export function ListaEsqueleto({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className={styles.esqueletos} role="status" aria-live="polite">
      <span className="sr-only">Carregando unidades…</span>
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className={`cartao ${styles.esqueletoCartao}`} aria-hidden="true">
          <div className="esqueleto" style={{ width: 44, height: 44, borderRadius: 14 }} />
          <div className={styles.esqueletoCorpo}>
            <div className="esqueleto" style={{ width: '48%', height: 18 }} />
            <div className="esqueleto" style={{ width: '70%', height: 12 }} />
            <div className="esqueleto" style={{ width: '58%', height: 12 }} />
          </div>
          <div className="esqueleto" style={{ width: 110, height: 52 }} />
        </div>
      ))}
    </div>
  )
}
