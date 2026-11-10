import type { FilaResponse } from '../../types/fila'
import { haQuanto } from '../../utils/formatadores'
import { Icone, type NomeIcone } from '../ui/Icone'
import styles from './ResumoFila.module.css'

interface Indicador {
  rotulo: string
  valor: string
  detalhe: string
  icone: NomeIcone
  tom: 'azul' | 'verde' | 'roxo' | 'laranja'
}

/** Quatro números da fila da unidade escolhida. */
export function ResumoFila({ fila }: { fila: FilaResponse }) {
  const proxima = fila.senhas_aguardando[0]
  const indicadores: Indicador[] = [
    { rotulo: 'Aguardando', valor: String(fila.aguardando), detalhe: 'senhas na fila', icone: 'pessoas', tom: 'azul' },
    { rotulo: 'Em atendimento', valor: String(fila.em_atendimento), detalhe: 'senhas sendo atendidas', icone: 'pulso', tom: 'verde' },
    {
      rotulo: 'Próxima a chamar',
      valor: proxima ? proxima.codigo_senha : '—',
      detalhe: proxima ? `retirada ${haQuanto(proxima.entrada)}` : 'fila vazia',
      icone: 'senha',
      tom: 'roxo',
    },
    {
      rotulo: 'Maior espera',
      valor: proxima ? haQuanto(proxima.entrada).replace('há ', '') : '—',
      detalhe: 'da senha mais antiga',
      icone: 'relogio',
      tom: 'laranja',
    },
  ]

  return (
    <ul className={styles.grade} aria-label="Resumo da fila">
      {indicadores.map((item) => (
        <li key={item.rotulo} className={`cartao ${styles.indicador}`}>
          <span className={`${styles.icone} ${styles[item.tom]}`}>
            <Icone nome={item.icone} tamanho={18} />
          </span>
          <span className={styles.rotulo}>{item.rotulo}</span>
          <strong>{item.valor}</strong>
          <small>{item.detalhe}</small>
        </li>
      ))}
    </ul>
  )
}
