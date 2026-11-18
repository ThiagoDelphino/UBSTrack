import { Link } from 'react-router-dom'
import type { Unidade } from '../../types/unidade'
import {
  formatarAprox,
  formatarDistancia,
  formatarHaMinutos,
  formatarMinutos,
  formatarPessoas,
  ordinal,
} from '../../utils/formatadores'
import { AvisoDesatualizado } from '../feedback/AvisoDesatualizado'
import { Icone } from '../ui/Icone'
import { SeloSituacao } from './SeloSituacao'
import styles from './CartaoUnidade.module.css'

/** Um item da lista: posição, nome, métricas e o tempo total estimado. Só desenha, não busca nada. */
export function CartaoUnidade({ unidade }: { unidade: Unidade }) {
  const temTotal = unidade.tempo_total_min !== null
  const destaque = unidade.tempo_total_min ?? unidade.espera_min

  return (
    <article
      className={`cartao ${styles.cartao} ${!unidade.aberta ? styles.fechada : ''}`}
      aria-labelledby={`unidade-${unidade.id}`}
    >
      <div className={styles.posicao} aria-label={unidade.posicao ? `Posição ${unidade.posicao}` : 'Sem posição'}>
        {unidade.posicao ? ordinal(unidade.posicao) : '—'}
      </div>

      <div className={styles.corpo}>
        <div className={styles.titulo}>
          <h3 id={`unidade-${unidade.id}`}>
            <Link to={`/unidades/${unidade.id}`} className={styles.link}>
              {unidade.nome}
            </Link>
          </h3>
          {unidade.aberta ? (
            <SeloSituacao situacao={unidade.situacao} />
          ) : (
            <span className={styles.seloFechada}>Fechada agora</span>
          )}
        </div>

        {unidade.endereco && (
          <p className={styles.endereco}>
            <Icone nome="pin" tamanho={14} /> {unidade.endereco}
          </p>
        )}

        <dl className={styles.metricas}>
          <div>
            <dt>
              <Icone nome="pessoas" tamanho={14} /> Na fila
            </dt>
            <dd>{formatarPessoas(unidade.fila)}</dd>
          </div>
          <div>
            <dt>
              <Icone nome="relogio" tamanho={14} /> Espera
            </dt>
            <dd>{formatarAprox(unidade.espera_min)}</dd>
          </div>
          {unidade.distancia_km !== null && (
            <div>
              <dt>
                <Icone nome="navegar" tamanho={14} /> Distância
              </dt>
              <dd>{formatarDistancia(unidade.distancia_km)}</dd>
            </div>
          )}
          {unidade.deslocamento_min !== null && (
            <div>
              <dt>
                <Icone nome="pulso" tamanho={14} /> Deslocamento
              </dt>
              <dd>{formatarAprox(unidade.deslocamento_min)}</dd>
            </div>
          )}
        </dl>

        {unidade.desatualizado && <AvisoDesatualizado minutos={unidade.atualizado_ha_min} />}
      </div>

      <div className={styles.total}>
        <span className={styles.totalRotulo}>{temTotal ? 'Tempo total estimado' : 'Espera estimada'}</span>
        <strong>{unidade.aberta ? `aprox. ${formatarMinutos(destaque)}` : '—'}</strong>
        {unidade.aberta && temTotal && (
          <small>
            {formatarMinutos(unidade.deslocamento_min ?? 0)} de deslocamento + {formatarMinutos(unidade.espera_min)}{' '}
            de espera
          </small>
        )}
        {unidade.aberta && !temTotal && <small>sem somar o deslocamento</small>}
        {unidade.atualizado_ha_min !== null && !unidade.desatualizado && (
          <small className={styles.atualizado}>Atualizado {formatarHaMinutos(unidade.atualizado_ha_min)}</small>
        )}
      </div>
    </article>
  )
}
