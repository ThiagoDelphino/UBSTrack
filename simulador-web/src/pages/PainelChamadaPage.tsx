import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListaChamada } from '../components/chamada/ListaChamada'
import { SenhaChamada } from '../components/chamada/SenhaChamada'
import { Logo } from '../components/layout/Logo'
import { Icone } from '../components/ui/Icone'
import { useAgora } from '../hooks/useAgora'
import { useFila } from '../hooks/useFila'
import { useUnidadeSelecionada } from '../hooks/useUnidadeSelecionada'
import { useUnidadesSimulador } from '../hooks/useUnidadesSimulador'
import type { SenhaNaFila } from '../types/fila'
import styles from './PainelChamadaPage.module.css'

/** "TV da recepção": a senha chamada em destaque, em tela cheia e sem menu. */
export function PainelChamadaPage() {
  const unidades = useUnidadesSimulador()
  const { idUbs, escolher } = useUnidadeSelecionada(unidades.dados)

  useEffect(() => {
    document.title = 'Painel de chamada · UBSTrack'
  }, [])

  return (
    <div className={styles.tela}>
      {unidades.dados && idUbs !== null ? (
        <Conteudo unidades={unidades.dados} idUbs={idUbs} aoEscolher={escolher} />
      ) : (
        <div className={styles.mensagem} role="status">
          {unidades.erro ? (
            <>
              <p>Não foi possível conectar à API do simulador.</p>
              <button type="button" className="btn btn-primario" onClick={unidades.recarregar}>
                Tentar novamente
              </button>
            </>
          ) : (
            <p>Carregando…</p>
          )}
        </div>
      )}
    </div>
  )
}

interface ConteudoProps {
  unidades: { id: number; nome: string }[]
  idUbs: number
  aoEscolher: (id: number) => void
}

function Conteudo({ unidades, idUbs, aoEscolher }: ConteudoProps) {
  const agora = useAgora()
  const { dados: fila, erro } = useFila(idUbs, 3000)
  const [telaCheia, setTelaCheia] = useState(false)

  useEffect(() => {
    const aoMudar = () => setTelaCheia(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', aoMudar)
    return () => document.removeEventListener('fullscreenchange', aoMudar)
  }, [])

  function alternarTelaCheia() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }

  const emAtendimento: SenhaNaFila[] = fila?.senhas_em_atendimento ?? []
  // A chamada mais recente é a que começou por último.
  const ordenadas = [...emAtendimento].sort(
    (a, b) => new Date(b.inicio_atendimento ?? 0).getTime() - new Date(a.inicio_atendimento ?? 0).getTime(),
  )
  const atual = ordenadas[0] ?? null
  const anteriores = ordenadas.slice(1)

  return (
    <>
      <header className={styles.topo}>
        <div className={styles.marca}>
          <Logo tamanho={48} />
          <div>
            <strong>UBSTrack</strong>
            <span>PAINEL DE CHAMADA</span>
          </div>
        </div>

        <div className={styles.unidade}>
          <label htmlFor="tv-unidade" className="sr-only">
            Unidade
          </label>
          <select id="tv-unidade" value={idUbs} onChange={(e) => aoEscolher(Number(e.target.value))}>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.direita}>
          <time className={styles.relogio} dateTime={agora.toISOString()}>
            {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </time>
          <button type="button" className={styles.botao} onClick={alternarTelaCheia} aria-pressed={telaCheia}>
            <Icone nome="expandir" tamanho={18} />
            <span>{telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}</span>
          </button>
          <Link to={`/?ubs=${idUbs}`} className={styles.botao}>
            <Icone nome="voltar" tamanho={18} />
            <span>Operação</span>
          </Link>
        </div>
      </header>

      <main className={styles.grade}>
        <SenhaChamada senha={atual} />

        <div className={styles.lateral}>
          <ListaChamada
            titulo="Em atendimento"
            senhas={anteriores}
            vazio="Nenhuma outra senha em atendimento."
            limite={3}
            tom="verde"
            mostrar="inicio"
          />
          <ListaChamada
            titulo="Próximas senhas"
            senhas={fila?.senhas_aguardando ?? []}
            vazio="Ninguém aguardando."
            limite={5}
            tom="azul"
            mostrar="entrada"
          />
        </div>
      </main>

      <footer className={styles.rodape}>
        {erro ? (
          <span className={styles.erro} role="alert">
            Sem conexão com a API. Mostrando a última informação recebida.
          </span>
        ) : (
          <span>Dados simulados para demonstração · atualiza a cada 3 s</span>
        )}
      </footer>
    </>
  )
}
