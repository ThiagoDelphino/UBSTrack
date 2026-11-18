import type { Unidade } from '../../types/unidade'
import { CartaoUnidade } from './CartaoUnidade'
import styles from './ListaUnidades.module.css'

/** Lista numerada (a API já manda na ordem certa). */
export function ListaUnidades({ unidades }: { unidades: Unidade[] }) {
  return (
    <ol className={styles.lista}>
      {unidades.map((unidade) => (
        <li key={unidade.id}>
          <CartaoUnidade unidade={unidade} />
        </li>
      ))}
    </ol>
  )
}
