import type { ReactNode } from 'react'
import { useStatusApi } from '../../hooks/useStatusApi'
import { Layout, type ItemMenu } from './Layout'
import { MiniAutomatico } from './MiniAutomatico'
import { StatusApi } from './StatusApi'
import { TrocaDeInterface } from './TrocaDeInterface'
import styles from './Casca.module.css'

const PAINEL_URL = import.meta.env.VITE_PAINEL_URL ?? 'http://localhost:5173'

const ITENS_MENU: ItemMenu[] = [
  { para: '/', rotulo: 'Operação', icone: 'senha', exato: true },
  { para: '/visao-geral', rotulo: 'Visão geral', icone: 'painel' },
  { para: '/painel-chamada', rotulo: 'Painel de chamada', icone: 'tv', novaAba: true },
]

interface CascaProps {
  titulo: string
  acoes?: ReactNode
  children: ReactNode
}

/** Moldura de todas as telas do simulador (a tela de TV não usa: ela é tela cheia). */
export function Casca({ titulo, acoes, children }: CascaProps) {
  const statusApi = useStatusApi()

  return (
    <Layout
      subtituloMarca="SIMULADOR DE FILAS"
      itensMenu={ITENS_MENU}
      eyebrow="OPERADOR · DADOS SIMULADOS"
      titulo={titulo}
      acoes={
        <>
          <span className={styles.simulacao}>Simulação</span>
          <StatusApi estado={statusApi} />
          {acoes}
        </>
      }
      rodapeMenu={
        <>
          <MiniAutomatico />
          <TrocaDeInterface rotulo="Abrir painel" descricao="Interface do cidadão" href={PAINEL_URL} />
        </>
      }
    >
      {children}
    </Layout>
  )
}
