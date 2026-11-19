import type { EstadoLocalizacao } from '../../hooks/useLocalizacao'
import { Icone } from '../ui/Icone'
import styles from './BarraLocalizacao.module.css'

interface BarraLocalizacaoProps {
  estado: EstadoLocalizacao
  aoSolicitar: () => void
  aoDesativar: () => void
}

/**
 * Explica como a lista está sendo ordenada. Sem localização (regra 9), avisa que a
 * distância não está sendo considerada, sem esconder nenhuma unidade.
 */
export function BarraLocalizacao({ estado, aoSolicitar, aoDesativar }: BarraLocalizacaoProps) {
  if (estado === 'ativa') {
    return (
      <section className={`${styles.barra} ${styles.ativa}`} aria-live="polite">
        <Icone nome="mira" tamanho={20} />
        <p>
          <strong>Usando sua localização aproximada.</strong> O tempo total soma o deslocamento (em linha reta) e
          a espera na fila.
        </p>
        <button type="button" className="btn btn-secundario btn-pequeno" onClick={aoDesativar}>
          Parar de usar
        </button>
      </section>
    )
  }

  if (estado === 'obtendo') {
    return (
      <section className={`${styles.barra} ${styles.neutra}`} aria-live="polite">
        <Icone nome="atualizar" tamanho={20} className="girando" />
        <p>
          <strong>Obtendo sua localização…</strong> Autorize no navegador para somar o deslocamento.
        </p>
      </section>
    )
  }

  const negada = estado === 'negada' || estado === 'indisponivel'

  return (
    <section className={`${styles.barra} ${negada ? styles.aviso : styles.neutra}`} aria-live="polite">
      <Icone nome={negada ? 'alerta' : 'mira'} tamanho={20} />
      <p>
        {negada ? (
          <>
            <strong>Não conseguimos usar sua localização.</strong> A lista está ordenada só pela espera na
            fila: a distância não está sendo considerada.
          </>
        ) : (
          <>
            <strong>Ordenada só pela espera na fila.</strong> Permita sua localização para somar o tempo de
            deslocamento até cada unidade.
          </>
        )}
      </p>
      <button type="button" className="btn btn-primario btn-pequeno" onClick={aoSolicitar}>
        {negada ? 'Tentar novamente' : 'Usar minha localização'}
      </button>
    </section>
  )
}
