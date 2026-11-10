import { Icone } from '../ui/Icone'
import styles from './CartaoSamu.module.css'

/** Cartão do menu lateral: atalho para ligar para o SAMU. */
export function CartaoSamu() {
  return (
    <div className={styles.cartao}>
      <span className={styles.icone}>
        <Icone nome="telefone" tamanho={18} />
      </span>
      <strong>Emergência?</strong>
      <p>Não use o painel. Ligue agora para o SAMU.</p>
      <a href="tel:192" className={styles.ligar}>
        Ligar 192
      </a>
    </div>
  )
}
