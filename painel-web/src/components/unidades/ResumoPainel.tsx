import type { Unidade } from '../../types/unidade'
import { formatarHora, formatarMinutos } from '../../utils/formatadores'
import { Icone, type NomeIcone } from '../ui/Icone'
import styles from './ResumoPainel.module.css'

interface ResumoPainelProps {
  unidades: Unidade[]
  atualizadoEm: Date | null
}

interface Indicador {
  rotulo: string
  valor: string
  detalhe: string
  icone: NomeIcone
  tom: 'azul' | 'verde' | 'roxo' | 'laranja'
}

/** Quatro números que resumem a rede de unidades neste momento. */
export function ResumoPainel({ unidades, atualizadoEm }: ResumoPainelProps) {
  const abertas = unidades.filter((u) => u.aberta)
  const pessoasNaFila = abertas.reduce((soma, u) => soma + u.fila, 0)
  const menorEspera = abertas.length ? Math.min(...abertas.map((u) => u.espera_min)) : null

  const indicadores: Indicador[] = [
    {
      rotulo: 'Unidades abertas',
      valor: `${abertas.length} de ${unidades.length}`,
      detalhe: 'neste momento',
      icone: 'hospital',
      tom: 'azul',
    },
    {
      rotulo: 'Pessoas na fila',
      valor: String(pessoasNaFila),
      detalhe: 'somando as unidades abertas',
      icone: 'pessoas',
      tom: 'roxo',
    },
    {
      rotulo: 'Menor espera estimada',
      valor: menorEspera === null ? '—' : menorEspera === 0 ? 'Sem espera' : `aprox. ${formatarMinutos(menorEspera)}`,
      detalhe: 'entre as unidades abertas',
      icone: 'relogio',
      tom: 'verde',
    },
    {
      rotulo: 'Última atualização',
      valor: atualizadoEm ? formatarHora(atualizadoEm) : '—',
      detalhe: 'atualiza sozinho a cada 30 s',
      icone: 'atualizar',
      tom: 'laranja',
    },
  ]

  return (
    <ul className={styles.grade} aria-label="Resumo">
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
