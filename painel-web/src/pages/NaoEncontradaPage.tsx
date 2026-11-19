import { Link } from 'react-router-dom'
import { Casca } from '../components/layout/Casca'
import { EstadoVazio } from '../components/feedback/EstadoVazio'

interface NaoEncontradaPageProps {
  mensagem?: string
}

export function NaoEncontradaPage({ mensagem = 'O endereço que você abriu não existe neste painel.' }: NaoEncontradaPageProps) {
  return (
    <Casca titulo="Página não encontrada">
      <EstadoVazio
        icone="buscar"
        titulo="Página não encontrada"
        mensagem={mensagem}
        acao={
          <Link to="/" className="btn btn-primario">
            Voltar ao início
          </Link>
        }
      />
    </Casca>
  )
}
