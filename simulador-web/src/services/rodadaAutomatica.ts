import { ApiError } from './api'
import {
  buscarFila,
  chamarProximo,
  desistirDaSenha,
  finalizarAtendimento,
  listarUnidades,
  retirarSenha,
} from './simuladorService'
import type { NovoEvento } from '../context/simulacao'
import { escolherAcao } from '../utils/modoAutomatico'

/**
 * Uma rodada do modo automático: para cada unidade, olha a fila e faz UMA ação
 * (retirar, chamar, finalizar ou desistir). Usa as mesmas rotas que o operador usa
 * na tela, então o painel enxerga o movimento como se fosse um hospital de verdade.
 */
export async function executarRodada(aoRegistrar: (evento: NovoEvento) => void): Promise<void> {
  const unidades = await listarUnidades()

  await Promise.all(
    unidades.map(async (unidade) => {
      try {
        const fila = await buscarFila(unidade.id)
        const acao = escolherAcao(fila.aguardando, fila.em_atendimento, Math.random())

        if (acao === 'retirar') {
          const senha = await retirarSenha(unidade.id)
          aoRegistrar({ tipo: 'retirada', origem: 'automatico', texto: `${unidade.nome}: senha ${senha.codigo_senha} retirada` })
        } else if (acao === 'chamar') {
          const senha = await chamarProximo(unidade.id)
          aoRegistrar({ tipo: 'chamada', origem: 'automatico', texto: `${unidade.nome}: senha ${senha.codigo_senha} chamada` })
        } else if (acao === 'finalizar') {
          const alvo = fila.senhas_em_atendimento[0]
          const senha = await finalizarAtendimento(alvo.id_atendimento)
          aoRegistrar({ tipo: 'finalizacao', origem: 'automatico', texto: `${unidade.nome}: senha ${senha.codigo_senha} finalizada` })
        } else {
          const alvo = fila.senhas_aguardando[fila.senhas_aguardando.length - 1]
          const senha = await desistirDaSenha(alvo.id_atendimento)
          aoRegistrar({ tipo: 'desistencia', origem: 'automatico', texto: `${unidade.nome}: senha ${senha.codigo_senha} desistiu` })
        }
      } catch (e) {
        const motivo = e instanceof ApiError ? e.message : 'erro inesperado'
        aoRegistrar({ tipo: 'erro', origem: 'automatico', texto: `${unidade.nome}: ${motivo}` })
      }
    }),
  )
}
