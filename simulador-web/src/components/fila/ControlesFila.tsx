import { Icone } from '../ui/Icone'
import styles from './ControlesFila.module.css'

interface ControlesFilaProps {
  aguardando: number
  pendente: string | null
  aoRetirar: () => void
  aoChamar: () => void
}

/** Os dois botões grandes do operador: retirar senha e chamar o próximo. */
export function ControlesFila({ aguardando, pendente, aoRetirar, aoChamar }: ControlesFilaProps) {
  return (
    <section className={`cartao ${styles.controles}`} aria-labelledby="titulo-controles">
      <h2 id="titulo-controles">Ações da fila</h2>
      <p>Simule o que acontece na recepção da unidade.</p>

      <div className={styles.botoes}>
        <button type="button" className="btn btn-primario btn-grande" onClick={aoRetirar} disabled={pendente !== null}>
          <Icone nome="mais" tamanho={20} /> Retirar senha
        </button>
        <button
          type="button"
          className="btn btn-suave btn-grande"
          onClick={aoChamar}
          disabled={pendente !== null || aguardando === 0}
        >
          <Icone nome="chamar" tamanho={20} /> Chamar próximo
        </button>
      </div>
      {aguardando === 0 && <small className={styles.dica}>Ninguém aguardando: retire uma senha para começar.</small>}
    </section>
  )
}
