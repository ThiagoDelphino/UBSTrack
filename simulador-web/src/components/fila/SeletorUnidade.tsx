import type { UnidadeResumo } from '../../types/fila'
import { Icone } from '../ui/Icone'
import styles from './SeletorUnidade.module.css'

interface SeletorUnidadeProps {
  unidades: UnidadeResumo[]
  valor: number
  aoMudar: (id: number) => void
}

/** Escolhe em qual unidade o operador está trabalhando. */
export function SeletorUnidade({ unidades, valor, aoMudar }: SeletorUnidadeProps) {
  const atual = unidades.find((u) => u.id === valor)

  return (
    <section className={`cartao ${styles.seletor}`}>
      <span className={styles.icone}>
        <Icone nome="hospital" tamanho={22} />
      </span>
      <div className={styles.campo}>
        <label htmlFor="seletor-unidade" className="eyebrow">
          Unidade em operação
        </label>
        <div className={styles.selectEnvolve}>
          <select id="seletor-unidade" value={valor} onChange={(e) => aoMudar(Number(e.target.value))}>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
        {atual?.endereco && (
          <p className={styles.endereco}>
            <Icone nome="pin" tamanho={14} /> {atual.endereco}
          </p>
        )}
      </div>
    </section>
  )
}
