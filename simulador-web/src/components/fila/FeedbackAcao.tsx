import type { MensagemAcao } from '../../hooks/useAcoesFila'
import { Icone } from '../ui/Icone'
import styles from './FeedbackAcao.module.css'

/** Resultado da última ação (sucesso ou o motivo que a API deu para recusar). */
export function FeedbackAcao({ mensagem }: { mensagem: MensagemAcao | null }) {
  return (
    <div className={styles.area} role="status" aria-live="polite">
      {mensagem && (
        <p className={`${styles.mensagem} ${mensagem.tipo === 'ok' ? styles.ok : styles.erro}`}>
          <Icone nome={mensagem.tipo === 'ok' ? 'checkCirculo' : 'alerta'} tamanho={18} />
          <span>{mensagem.texto}</span>
        </p>
      )}
    </div>
  )
}
