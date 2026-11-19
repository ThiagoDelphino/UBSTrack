import type { ReactNode } from 'react'
import { Icone, type NomeIcone } from '../ui/Icone'
import styles from './Feedback.module.css'

interface EstadoVazioProps {
  titulo: string
  mensagem: string
  icone?: NomeIcone
  acao?: ReactNode
}

/** Estado vazio: "Nenhuma unidade encontrada" e afins. */
export function EstadoVazio({ titulo, mensagem, icone = 'hospital', acao }: EstadoVazioProps) {
  return (
    <div className={`cartao ${styles.caixa}`}>
      <span className={styles.icone}>
        <Icone nome={icone} tamanho={24} />
      </span>
      <h2>{titulo}</h2>
      <p>{mensagem}</p>
      {acao}
    </div>
  )
}
