import type { SenhaNaFila } from '../../types/fila'
import { haQuanto } from '../../utils/formatadores'
import { EstadoVazio } from '../feedback/EstadoVazio'
import { Icone } from '../ui/Icone'
import styles from './ListaSenhas.module.css'

interface ListaSenhasProps {
  emAtendimento: SenhaNaFila[]
  aguardando: SenhaNaFila[]
  pendente: string | null
  aoFinalizar: (senha: SenhaNaFila) => void
  aoDesistir: (senha: SenhaNaFila) => void
}

/** Senhas da unidade: quem está sendo atendido (finalizar) e quem aguarda (desistir). */
export function ListaSenhas({ emAtendimento, aguardando, pendente, aoFinalizar, aoDesistir }: ListaSenhasProps) {
  return (
    <div className={styles.colunas}>
      <section className={`cartao ${styles.bloco}`} aria-labelledby="titulo-em-atendimento">
        <header>
          <h2 id="titulo-em-atendimento">Em atendimento</h2>
          <span className={`${styles.contagem} ${styles.contagemVerde}`}>{emAtendimento.length}</span>
        </header>
        {emAtendimento.length === 0 ? (
          <p className={styles.vazio}>Nenhuma senha em atendimento.</p>
        ) : (
          <ul className={styles.lista}>
            {emAtendimento.map((senha) => (
              <li key={senha.id_atendimento} className={styles.item}>
                <span className={`${styles.codigo} ${styles.codigoVerde}`}>{senha.codigo_senha}</span>
                <div className={styles.info}>
                  <strong>Em atendimento</strong>
                  <span>começou {senha.inicio_atendimento ? haQuanto(senha.inicio_atendimento) : 'agora'}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sucesso btn-pequeno"
                  onClick={() => aoFinalizar(senha)}
                  disabled={pendente !== null}
                >
                  <Icone nome="check" tamanho={15} /> Finalizar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="titulo-aguardando">
        <header>
          <h2 id="titulo-aguardando">Aguardando</h2>
          <span className={styles.contagem}>{aguardando.length}</span>
        </header>
        {aguardando.length === 0 ? (
          <EstadoVazio titulo="Fila vazia" mensagem="Retire uma senha para ela aparecer aqui." icone="senha" />
        ) : (
          <ul className={styles.lista}>
            {aguardando.map((senha, posicao) => (
              <li key={senha.id_atendimento} className={styles.item}>
                <span className={styles.codigo}>{senha.codigo_senha}</span>
                <div className={styles.info}>
                  <strong>{posicao === 0 ? 'Próxima a ser chamada' : `${posicao + 1}ª da fila`}</strong>
                  <span>retirada {haQuanto(senha.entrada)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-perigo btn-pequeno"
                  onClick={() => aoDesistir(senha)}
                  disabled={pendente !== null}
                >
                  <Icone nome="desistir" tamanho={15} /> Desistir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
