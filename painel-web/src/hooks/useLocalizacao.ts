import { useCallback, useEffect, useState } from 'react'
import type { Coordenadas } from '../types/unidade'

export type EstadoLocalizacao =
  | 'ociosa' // ainda não pedimos
  | 'obtendo' // esperando o navegador responder
  | 'ativa' // temos as coordenadas
  | 'negada' // o cidadão recusou
  | 'indisponivel' // sem GPS, sem HTTPS ou deu timeout

const CHAVE = 'ubstrack:painel:localizacao'

/** Coordenadas guardadas só nesta aba (sessionStorage), para a tela de detalhe reaproveitar a da lista. */
function lerSalva(): Coordenadas | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    if (!bruto) return null
    const { lat, lon } = JSON.parse(bruto) as Partial<Coordenadas>
    return typeof lat === 'number' && typeof lon === 'number' ? { lat, lon } : null
  } catch {
    return null // sem sessionStorage ou valor corrompido: segue sem localização
  }
}

function salvar(coords: Coordenadas | null) {
  try {
    if (coords) sessionStorage.setItem(CHAVE, JSON.stringify(coords))
    else sessionStorage.removeItem(CHAVE)
  } catch {
    // sem sessionStorage: a localização vale só enquanto a tela estiver aberta
  }
}

/**
 * Pede o GPS e trata a recusa (regra 9). Não abre o pedido sozinho: se a pessoa
 * ainda não decidiu, mostramos um botão. Se já tinha permitido antes, obtém direto.
 */
export function useLocalizacao() {
  const [coords, setCoords] = useState<Coordenadas | null>(lerSalva)
  const [estado, setEstado] = useState<EstadoLocalizacao>(() => (lerSalva() ? 'ativa' : 'ociosa'))

  const solicitar = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setEstado('indisponivel')
      return
    }
    setEstado('obtendo')
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        // 3 casas decimais (~100 m) bastam para a estimativa e expõem menos.
        const nova = {
          lat: Number(posicao.coords.latitude.toFixed(3)),
          lon: Number(posicao.coords.longitude.toFixed(3)),
        }
        salvar(nova)
        setCoords(nova)
        setEstado('ativa')
      },
      (erro) => {
        salvar(null)
        setCoords(null)
        setEstado(erro.code === erro.PERMISSION_DENIED ? 'negada' : 'indisponivel')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }, [])

  const desativar = useCallback(() => {
    salvar(null)
    setCoords(null)
    setEstado('ociosa')
  }, [])

  // Se a permissão já foi concedida em outra visita (e não há coordenadas na sessão), usa sem perguntar de novo.
  useEffect(() => {
    if (lerSalva()) return
    let ativo = true
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((permissao) => {
        if (ativo && permissao.state === 'granted') solicitar()
      })
      .catch(() => {
        // navegador sem a Permissions API: o botão continua disponível
      })
    return () => {
      ativo = false
    }
  }, [solicitar])

  return { estado, coords, solicitar, desativar }
}
