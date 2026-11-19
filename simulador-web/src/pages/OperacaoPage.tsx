import { Casca } from '../components/layout/Casca'
import { EstadoVazio } from '../components/feedback/EstadoVazio'
import { MensagemErro } from '../components/feedback/MensagemErro'
import { ControlesFila } from '../components/fila/ControlesFila'
import { FeedbackAcao } from '../components/fila/FeedbackAcao'
import { ListaSenhas } from '../components/fila/ListaSenhas'
import { ModoAutomatico } from '../components/fila/ModoAutomatico'
import { RegistroAcoes } from '../components/fila/RegistroAcoes'
import { ResumoFila } from '../components/fila/ResumoFila'
import { SeletorUnidade } from '../components/fila/SeletorUnidade'
import { Icone } from '../components/ui/Icone'
import { useAcoesFila } from '../hooks/useAcoesFila'
import { useFila } from '../hooks/useFila'
import { useUnidadeSelecionada } from '../hooks/useUnidadeSelecionada'
import { useUnidadesSimulador } from '../hooks/useUnidadesSimulador'
import {
  chamarProximo,
  desistirDaSenha,
  finalizarAtendimento,
  retirarSenha,
} from '../services/simuladorService'
import type { SenhaNaFila, UnidadeResumo } from '../types/fila'
import styles from './OperacaoPage.module.css'

/** Tela do operador: escolher a unidade e operar a fila. */
export function OperacaoPage() {
  const unidades = useUnidadesSimulador()
  const { idUbs, escolher } = useUnidadeSelecionada(unidades.dados)

  return (
    <Casca titulo="Operação da fila">
      {unidades.carregando && <p className={styles.carregando} role="status">Carregando unidades…</p>}

      {!unidades.carregando && unidades.erro && !unidades.dados && (
        <MensagemErro
          mensagem={`${unidades.erro.message} Confira se a simulador-api está no ar e tente de novo.`}
          aoTentarNovamente={unidades.recarregar}
        />
      )}

      {unidades.dados && unidades.dados.length === 0 && (
        <EstadoVazio
          titulo="Nenhuma unidade cadastrada"
          mensagem="Carregue os dados de demonstração (database/seeds) para ter unidades e filas para operar."
        />
      )}

      {unidades.dados && idUbs !== null && (
        <Operacao unidades={unidades.dados} idUbs={idUbs} aoEscolher={escolher} />
      )}
    </Casca>
  )
}

interface OperacaoProps {
  unidades: UnidadeResumo[]
  idUbs: number
  aoEscolher: (id: number) => void
}

function Operacao({ unidades, idUbs, aoEscolher }: OperacaoProps) {
  const { dados: fila, erro, carregando, recarregando, recarregar } = useFila(idUbs)
  const { executar, pendente, mensagem } = useAcoesFila()
  const unidade = unidades.find((u) => u.id === idUbs)
  const nome = unidade?.nome ?? 'Unidade'

  const retirar = () =>
    executar('retirar', 'retirada', async () => {
      const senha = await retirarSenha(idUbs)
      return `${nome}: senha ${senha.codigo_senha} retirada.`
    })

  const chamar = () =>
    executar('chamar', 'chamada', async () => {
      const senha = await chamarProximo(idUbs)
      return `${nome}: senha ${senha.codigo_senha} chamada para atendimento.`
    })

  const finalizar = (senha: SenhaNaFila) =>
    executar(`finalizar-${senha.id_atendimento}`, 'finalizacao', async () => {
      await finalizarAtendimento(senha.id_atendimento)
      return `${nome}: atendimento da senha ${senha.codigo_senha} finalizado.`
    })

  const desistir = (senha: SenhaNaFila) =>
    executar(`desistir-${senha.id_atendimento}`, 'desistencia', async () => {
      await desistirDaSenha(senha.id_atendimento)
      return `${nome}: senha ${senha.codigo_senha} marcada como desistência.`
    })

  return (
    <div className={styles.pagina}>
      <div className={styles.topo}>
        <SeletorUnidade unidades={unidades} valor={idUbs} aoMudar={aoEscolher} />
        <div className={styles.atalhos}>
          <button type="button" className="btn btn-secundario" onClick={recarregar} disabled={recarregando}>
            <Icone nome="atualizar" tamanho={16} className={recarregando ? 'girando' : undefined} /> Atualizar fila
          </button>
          <a className="btn btn-secundario" href={`/painel-chamada?ubs=${idUbs}`} target="_blank" rel="noreferrer">
            <Icone nome="tv" tamanho={16} /> Abrir painel de chamada
          </a>
        </div>
      </div>

      <FeedbackAcao mensagem={mensagem} />

      {carregando && <p className={styles.carregando} role="status">Carregando a fila…</p>}

      {!carregando && erro && !fila && (
        <MensagemErro mensagem={erro.message} aoTentarNovamente={recarregar} />
      )}

      {fila && (
        <>
          <ResumoFila fila={fila} />

          <div className={styles.duasColunas}>
            <ControlesFila aguardando={fila.aguardando} pendente={pendente} aoRetirar={retirar} aoChamar={chamar} />
            <ModoAutomatico />
          </div>

          <ListaSenhas
            emAtendimento={fila.senhas_em_atendimento}
            aguardando={fila.senhas_aguardando}
            pendente={pendente}
            aoFinalizar={finalizar}
            aoDesistir={desistir}
          />
        </>
      )}

      <RegistroAcoes />
    </div>
  )
}
