import type { ReactNode } from 'react'
import { useStatusApi } from '../../hooks/useStatusApi'
import { AvisoEmergencia } from './AvisoEmergencia'
import { CartaoSamu } from './CartaoSamu'
import { Layout, type ItemMenu } from './Layout'
import { StatusApi } from './StatusApi'
import { TrocaDeInterface } from './TrocaDeInterface'

const SIMULADOR_URL = import.meta.env.VITE_SIMULADOR_URL ?? 'http://localhost:5174'

const ITENS_MENU: ItemMenu[] = [
  { para: '/', rotulo: 'Unidades', icone: 'hospital', exato: true },
  { para: '/sobre', rotulo: 'Como funciona', icone: 'livro' },
]

interface CascaProps {
  titulo: string
  /** Botões extras na barra superior (ex.: "Atualizar"). */
  acoes?: ReactNode
  children: ReactNode
}

/**
 * Moldura de todas as telas do painel. O aviso do 192 (regra 10) fica aqui
 * dentro, então nenhuma página consegue esquecê-lo.
 */
export function Casca({ titulo, acoes, children }: CascaProps) {
  const statusApi = useStatusApi()

  return (
    <Layout
      subtituloMarca="PAINEL DO CIDADÃO"
      itensMenu={ITENS_MENU}
      eyebrow="SOROCABA · SP"
      titulo={titulo}
      acoes={
        <>
          <StatusApi estado={statusApi} />
          {acoes}
        </>
      }
      rodapeMenu={
        <>
          <CartaoSamu />
          <TrocaDeInterface
            rotulo="Abrir simulador"
            descricao="Interface do operador"
            href={SIMULADOR_URL}
          />
        </>
      }
    >
      <AvisoEmergencia />
      {children}
    </Layout>
  )
}
