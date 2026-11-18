import { useSimulacao } from '../../context/simulacao'
import { Icone } from '../ui/Icone'
import styles from './ModoAutomatico.module.css'

const RITMOS = [
  { segundos: 2, rotulo: 'Rápido (2 s)' },
  { segundos: 5, rotulo: 'Normal (5 s)' },
  { segundos: 10, rotulo: 'Lento (10 s)' },
]

/** Liga e desliga o modo automático e escolhe o ritmo. Vale para todas as unidades. */
export function ModoAutomatico() {
  const { automaticoAtivo, intervaloS, contadores, ligarAutomatico, desligarAutomatico, mudarIntervalo } =
    useSimulacao()

  return (
    <section className={`cartao ${styles.cartao} ${automaticoAtivo ? styles.ligado : ''}`} aria-labelledby="titulo-auto">
      <header>
        <span className={styles.icone}>
          <Icone nome="raio" tamanho={20} />
        </span>
        <div>
          <h2 id="titulo-auto">Modo automático</h2>
          <p>{automaticoAtivo ? 'Movimentando todas as unidades.' : 'As filas só mudam quando você agir.'}</p>
        </div>
      </header>

      <div className={styles.linha}>
        <label className={styles.ritmo}>
          <span className="eyebrow">Ritmo</span>
          <select value={intervaloS} onChange={(e) => mudarIntervalo(Number(e.target.value))}>
            {RITMOS.map((r) => (
              <option key={r.segundos} value={r.segundos}>
                {r.rotulo}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={`btn ${automaticoAtivo ? 'btn-secundario' : 'btn-primario'}`}
          onClick={automaticoAtivo ? desligarAutomatico : ligarAutomatico}
        >
          <Icone nome={automaticoAtivo ? 'pausa' : 'play'} tamanho={16} />
          {automaticoAtivo ? 'Desligar' : 'Ligar'}
        </button>
      </div>

      <dl className={styles.contadores}>
        <div>
          <dt>Retiradas</dt>
          <dd>{contadores.retiradas}</dd>
        </div>
        <div>
          <dt>Chamadas</dt>
          <dd>{contadores.chamadas}</dd>
        </div>
        <div>
          <dt>Finalizações</dt>
          <dd>{contadores.finalizacoes}</dd>
        </div>
        <div>
          <dt>Desistências</dt>
          <dd>{contadores.desistencias}</dd>
        </div>
      </dl>
      {contadores.erros > 0 && (
        <p className={styles.erros}>
          {contadores.erros} {contadores.erros === 1 ? 'ação foi recusada' : 'ações foram recusadas'} pela API (o modo segue rodando).
        </p>
      )}
      <small className={styles.nota}>Mantenha esta aba aberta: o movimento acontece pelo navegador.</small>
    </section>
  )
}
