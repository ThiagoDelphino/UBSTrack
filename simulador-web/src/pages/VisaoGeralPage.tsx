import { Link } from 'react-router-dom'
import { Casca } from '../components/layout/Casca'
import { EstadoVazio } from '../components/feedback/EstadoVazio'
import { MensagemErro } from '../components/feedback/MensagemErro'
import { Icone } from '../components/ui/Icone'
import { useVisaoGeral } from '../hooks/useVisaoGeral'
import type { FilaResponse } from '../types/fila'
import { formatarHoraCurta } from '../utils/formatadores'
import styles from './VisaoGeralPage.module.css'

/** Resumo de todas as unidades: quanto cada uma tem aguardando e em atendimento agora. */
export function VisaoGeralPage() {
  const { dados, erro, carregando, recarregando, atualizadoEm, recarregar } = useVisaoGeral()

  const botaoAtualizar = (
    <button
      type="button"
      className="btn btn-secundario"
      onClick={recarregar}
      disabled={recarregando}
      aria-label="Atualizar a visão geral"
    >
      <Icone nome="atualizar" tamanho={16} className={recarregando ? 'girando' : undefined} />
      <span className="oculto-mobile">Atualizar</span>
    </button>
  )

  const totalAguardando = dados?.reduce((s, f) => s + f.aguardando, 0) ?? 0
  const totalAtendimento = dados?.reduce((s, f) => s + f.em_atendimento, 0) ?? 0
  const maiorFila = dados && dados.length ? dados.reduce((a, b) => (b.aguardando > a.aguardando ? b : a)) : null
  const escalaBarra = Math.max(10, ...(dados?.map((f) => f.aguardando) ?? [0]))

  return (
    <Casca titulo="Visão geral" acoes={botaoAtualizar}>
      {carregando && <p className={styles.carregando} role="status">Carregando as unidades…</p>}

      {!carregando && erro && !dados && (
        <MensagemErro
          mensagem={`${erro.message} Confira se a simulador-api está no ar.`}
          aoTentarNovamente={recarregar}
        />
      )}

      {dados && dados.length === 0 && (
        <EstadoVazio titulo="Nenhuma unidade cadastrada" mensagem="Carregue o seed de demonstração para ver as filas aqui." />
      )}

      {dados && dados.length > 0 && (
        <>
          <ul className={styles.resumo} aria-label="Totais">
            <li className="cartao">
              <span>Unidades</span>
              <strong>{dados.length}</strong>
            </li>
            <li className="cartao">
              <span>Aguardando (total)</span>
              <strong>{totalAguardando}</strong>
            </li>
            <li className="cartao">
              <span>Em atendimento (total)</span>
              <strong>{totalAtendimento}</strong>
            </li>
            <li className="cartao">
              <span>Maior fila agora</span>
              <strong className={styles.textoMenor}>{maiorFila && maiorFila.aguardando > 0 ? maiorFila.nome : '—'}</strong>
              <small>{maiorFila && maiorFila.aguardando > 0 ? `${maiorFila.aguardando} aguardando` : 'todas vazias'}</small>
            </li>
          </ul>

          <p className={styles.atualizado}>
            Atualiza sozinho a cada 5 s{atualizadoEm ? ` · última vez às ${formatarHoraCurta(atualizadoEm)}` : ''}
          </p>

          <ul className={styles.grade}>
            {dados.map((fila) => (
              <li key={fila.id_ubs}>
                <CartaoUnidade fila={fila} escala={escalaBarra} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Casca>
  )
}

function CartaoUnidade({ fila, escala }: { fila: FilaResponse; escala: number }) {
  const largura = Math.min(100, (fila.aguardando / escala) * 100)

  return (
    <article className={`cartao ${styles.cartao}`} aria-labelledby={`ubs-${fila.id_ubs}`}>
      <h3 id={`ubs-${fila.id_ubs}`}>{fila.nome}</h3>

      <dl className={styles.numeros}>
        <div>
          <dt>Aguardando</dt>
          <dd>{fila.aguardando}</dd>
        </div>
        <div>
          <dt>Em atendimento</dt>
          <dd className={styles.verde}>{fila.em_atendimento}</dd>
        </div>
      </dl>

      <div
        className={styles.barra}
        role="img"
        aria-label={`${fila.aguardando} senhas aguardando, em uma escala de ${escala}`}
      >
        <span style={{ width: `${largura}%` }} />
      </div>

      <div className={styles.acoes}>
        <Link to={`/?ubs=${fila.id_ubs}`} className="btn btn-suave btn-pequeno">
          <Icone nome="senha" tamanho={15} /> Operar
        </Link>
        <a
          className="btn btn-secundario btn-pequeno"
          href={`/painel-chamada?ubs=${fila.id_ubs}`}
          target="_blank"
          rel="noreferrer"
        >
          <Icone nome="tv" tamanho={15} /> Painel de chamada
        </a>
      </div>
    </article>
  )
}
