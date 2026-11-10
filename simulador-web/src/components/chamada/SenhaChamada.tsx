import type { SenhaNaFila } from '../../types/fila'
import { haQuanto } from '../../utils/formatadores'
import styles from './SenhaChamada.module.css'

/** A senha chamada, em destaque. A `key` do código muda quando chama outra, o que dispara a animação. */
export function SenhaChamada({ senha }: { senha: SenhaNaFila | null }) {
  if (!senha) {
    return (
      <section className={`${styles.painel} ${styles.espera}`} aria-live="polite">
        <span className={styles.rotulo}>Aguardando chamada</span>
        <p className={styles.aviso}>Nenhuma senha em atendimento neste momento.</p>
      </section>
    )
  }

  return (
    <section className={styles.painel} aria-live="assertive">
      <span className={styles.rotulo}>Senha chamada</span>
      <strong key={senha.id_atendimento} className={styles.codigo}>
        {senha.codigo_senha}
      </strong>
      <span className={styles.detalhe}>
        Dirija-se ao atendimento · chamada {senha.inicio_atendimento ? haQuanto(senha.inicio_atendimento) : 'agora'}
      </span>
    </section>
  )
}
