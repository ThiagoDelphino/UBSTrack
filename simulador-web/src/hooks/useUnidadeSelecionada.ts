import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { UnidadeResumo } from '../types/fila'

const CHAVE = 'ubstrack:simulador:unidade'

function lerSalva(): number {
  try {
    return Number(sessionStorage.getItem(CHAVE))
  } catch {
    return 0 // navegador sem sessionStorage: segue sem lembrar
  }
}

/**
 * Qual unidade está selecionada. Vem do endereço (?ubs=2), o que permite compartilhar
 * o link da tela; se não vier, usa a última escolhida; se não houver, a primeira.
 */
export function useUnidadeSelecionada(unidades: UnidadeResumo[] | null) {
  const [params, setParams] = useSearchParams()

  const existe = (id: number) => unidades?.some((u) => u.id === id) ?? false
  const daUrl = Number(params.get('ubs'))
  const salva = lerSalva()

  let idUbs: number | null = null
  if (unidades && unidades.length > 0) {
    idUbs = existe(daUrl) ? daUrl : existe(salva) ? salva : unidades[0].id
  }

  const escolher = useCallback(
    (id: number) => {
      try {
        sessionStorage.setItem(CHAVE, String(id))
      } catch {
        // sem sessionStorage: a escolha vale só pela URL
      }
      setParams({ ubs: String(id) }, { replace: true })
    },
    [setParams],
  )

  return { idUbs, escolher }
}
