import { useSimulacao } from '../../context/simulacao'
import { Icone } from '../ui/Icone'
import styles from './MiniAutomatico.module.css'

/** Cartão do menu: mostra se o modo automático está ligado, em qualquer tela. */
export function MiniAutomatico() {
  const { automaticoAtivo, intervaloS, contadores, ligarAutomatico, desligarAutomatico } = useSimulacao()
  const total = contadores.retiradas + contadores.chamadas + contadores.finalizacoes + contadores.desistencias

  return (
    <div className={`${styles.cartao} ${automaticoAtivo ? styles.ligado : ''}`}>
      <span className={styles.icone}>
        <Icone nome="raio" tamanho={18} />
      </span>
      <strong>Modo automático</strong>
      <p>
        {automaticoAtivo
          ? `Ligado: uma rodada a cada ${intervaloS} s · ${total} ações`
          : 'Desligado. Ligue para as filas se mexerem sozinhas.'}
      </p>
      <button
        type="button"
        className={styles.botao}
        onClick={automaticoAtivo ? desligarAutomatico : ligarAutomatico}
      >
        <Icone nome={automaticoAtivo ? 'pausa' : 'play'} tamanho={14} />
        {automaticoAtivo ? 'Desligar' : 'Ligar'}
      </button>
    </div>
  )
}
