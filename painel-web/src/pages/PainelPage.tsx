import { useMemo, useState } from 'react'
import { Casca } from '../components/layout/Casca'
import { EstadoVazio } from '../components/feedback/EstadoVazio'
import { ListaEsqueleto } from '../components/feedback/ListaEsqueleto'
import { MensagemErro } from '../components/feedback/MensagemErro'
import { BarraLocalizacao } from '../components/unidades/BarraLocalizacao'
import { FiltrosUnidades, type FiltroSituacao } from '../components/unidades/FiltrosUnidades'
import { ListaUnidades } from '../components/unidades/ListaUnidades'
import { ResumoPainel } from '../components/unidades/ResumoPainel'
import { Icone } from '../components/ui/Icone'
import { useLocalizacao } from '../hooks/useLocalizacao'
import { useUnidades } from '../hooks/useUnidades'
import { formatarHora } from '../utils/formatadores'
import styles from './PainelPage.module.css'

/** Tela principal: lista de unidades ordenadas por tempo total estimado. */
export function PainelPage() {
  const localizacao = useLocalizacao()
  const { dados, erro, carregando, recarregando, atualizadoEm, recarregar } = useUnidades(localizacao.coords)
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState<FiltroSituacao>('todas')

  const visiveis = useMemo(() => {
    if (!dados) return []
    const termo = busca.trim().toLowerCase()
    return dados.filter((u) => {
      const bateBusca =
        termo === '' || u.nome.toLowerCase().includes(termo) || (u.endereco ?? '').toLowerCase().includes(termo)
      const bateSituacao = situacao === 'todas' || (u.aberta && u.situacao === situacao)
      return bateBusca && bateSituacao
    })
  }, [dados, busca, situacao])

  const botaoAtualizar = (
    <button
      type="button"
      className="btn btn-secundario"
      onClick={recarregar}
      disabled={recarregando}
      aria-label="Atualizar a lista"
    >
      <Icone nome="atualizar" tamanho={16} className={recarregando ? 'girando' : undefined} />
      <span className="oculto-mobile">Atualizar</span>
    </button>
  )

  return (
    <Casca titulo="Unidades de saúde" acoes={botaoAtualizar}>
      <section className={styles.introducao}>
        <h2>Onde a espera é menor agora?</h2>
        <p>
          Unidades ordenadas pelo <strong>tempo total estimado</strong>: deslocamento até lá + espera na fila. A
          numeração informa, não recomenda: quem decide é você.
        </p>
      </section>

      <BarraLocalizacao
        estado={localizacao.estado}
        aoSolicitar={localizacao.solicitar}
        aoDesativar={localizacao.desativar}
      />

      {carregando && <ListaEsqueleto />}

      {!carregando && erro && !dados && (
        <MensagemErro
          mensagem={`${erro.message} Confira se a painel-api está no ar e tente de novo.`}
          aoTentarNovamente={recarregar}
        />
      )}

      {dados && (
        <>
          {erro && (
            <p className={styles.erroAtualizacao} role="alert">
              <Icone nome="alerta" tamanho={16} />
              Não foi possível atualizar agora. Mostrando os dados de {atualizadoEm ? formatarHora(atualizadoEm) : 'antes'}.
              <button type="button" onClick={recarregar}>
                Tentar de novo
              </button>
            </p>
          )}

          {dados.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma unidade encontrada"
              mensagem="Ainda não há unidades cadastradas. Assim que houver, elas aparecem aqui."
            />
          ) : (
            <>
              <ResumoPainel unidades={dados} atualizadoEm={atualizadoEm} />
              <FiltrosUnidades
                busca={busca}
                aoMudarBusca={setBusca}
                situacao={situacao}
                aoMudarSituacao={setSituacao}
              />
              {visiveis.length === 0 ? (
                <EstadoVazio
                  icone="buscar"
                  titulo="Nada com esses filtros"
                  mensagem="Nenhuma unidade combina com a busca. Tente outro nome ou limpe os filtros."
                  acao={
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={() => {
                        setBusca('')
                        setSituacao('todas')
                      }}
                    >
                      Limpar filtros
                    </button>
                  }
                />
              ) : (
                <ListaUnidades unidades={visiveis} />
              )}
            </>
          )}
        </>
      )}
    </Casca>
  )
}
