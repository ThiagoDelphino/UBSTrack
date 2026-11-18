import { Link } from 'react-router-dom'
import { Casca } from '../components/layout/Casca'
import { EstadoVazio } from '../components/feedback/EstadoVazio'

export function NaoEncontradaPage() {
  return (
    <Casca titulo="Página não encontrada">
      <EstadoVazio
        icone="buscar"
        titulo="Página não encontrada"
        mensagem="O endereço que você abriu não existe neste simulador."
        acao={
          <Link to="/" className="btn btn-primario">
            Voltar à operação
          </Link>
        }
      />
    </Casca>
  )
}
