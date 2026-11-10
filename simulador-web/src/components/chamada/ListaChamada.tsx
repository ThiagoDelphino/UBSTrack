import type { SenhaNaFila } from '../../types/fila'
import { haQuanto } from '../../utils/formatadores'
import styles from './ListaChamada.module.css'

interface ListaChamadaProps {
  titulo: string
  senhas: SenhaNaFila[]
  vazio: string
  /** Quantas senhas mostrar (o total aparece no título). */
  limite: number
  tom: 'verde' | 'azul'
  /** Qual horário exibir ao lado do código. */
  mostrar: 'inicio' | 'entrada'
}

/** Lista simples para a tela de TV (letras grandes, alto contraste). */
export function ListaChamada({ titulo, senhas, vazio, limite, tom, mostrar }: ListaChamadaProps) {
  const visiveis = senhas.slice(0, limite)

  return (
    <section className={styles.bloco}>
      <h2>
        {titulo} <span className={styles.contagem}>{senhas.length}</span>
      </h2>
      {visiveis.length === 0 ? (
        <p className={styles.vazio}>{vazio}</p>
      ) : (
        <ul>
          {visiveis.map((senha) => (
            <li key={senha.id_atendimento}>
              <span className={`${styles.codigo} ${styles[tom]}`}>{senha.codigo_senha}</span>
              <span className={styles.tempo}>
                {mostrar === 'inicio' && senha.inicio_atendimento
                  ? haQuanto(senha.inicio_atendimento)
                  : haQuanto(senha.entrada)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
