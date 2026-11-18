import type { Situacao } from '../../types/unidade'
import { Icone } from '../ui/Icone'
import styles from './FiltrosUnidades.module.css'

export type FiltroSituacao = 'todas' | Situacao

const OPCOES: { valor: FiltroSituacao; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'baixa', rotulo: 'Fila baixa' },
  { valor: 'moderada', rotulo: 'Fila moderada' },
  { valor: 'alta', rotulo: 'Fila alta' },
]

interface FiltrosUnidadesProps {
  busca: string
  aoMudarBusca: (texto: string) => void
  situacao: FiltroSituacao
  aoMudarSituacao: (valor: FiltroSituacao) => void
}

/** Busca por nome/endereço e filtro por situação. Filtrar não muda a numeração da API. */
export function FiltrosUnidades({ busca, aoMudarBusca, situacao, aoMudarSituacao }: FiltrosUnidadesProps) {
  return (
    <div className={styles.barra}>
      <label className={styles.busca}>
        <span className="sr-only">Buscar unidade por nome ou endereço</span>
        <Icone nome="buscar" tamanho={18} />
        <input
          type="search"
          value={busca}
          onChange={(e) => aoMudarBusca(e.target.value)}
          placeholder="Buscar por nome ou endereço"
        />
      </label>

      <div className={styles.chips} role="group" aria-label="Filtrar por situação da fila">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className={`${styles.chip} ${situacao === opcao.valor ? styles.chipAtivo : ''}`}
            aria-pressed={situacao === opcao.valor}
            onClick={() => aoMudarSituacao(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </div>
  )
}
