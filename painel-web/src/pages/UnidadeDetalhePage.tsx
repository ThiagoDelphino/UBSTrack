import { Link, useParams } from 'react-router-dom'
import { Casca } from '../components/layout/Casca'
import { AvisoDesatualizado } from '../components/feedback/AvisoDesatualizado'
import { ListaEsqueleto } from '../components/feedback/ListaEsqueleto'
import { MensagemErro } from '../components/feedback/MensagemErro'
import { Icone } from '../components/ui/Icone'
import { SeloSituacao } from '../components/unidades/SeloSituacao'
import { useLocalizacao } from '../hooks/useLocalizacao'
import { useUnidade } from '../hooks/useUnidade'
import {
  formatarAprox,
  formatarDistancia,
  formatarHaMinutos,
  formatarMinutos,
  formatarPessoas,
} from '../utils/formatadores'
import { NaoEncontradaPage } from './NaoEncontradaPage'
import styles from './UnidadeDetalhePage.module.css'

/** Detalhe de uma unidade: números, como o tempo foi composto e atalho para a rota. */
export function UnidadeDetalhePage() {
  const { id } = useParams()
  const idNumero = Number(id)
  const idValido = Number.isInteger(idNumero) && idNumero > 0

  if (!idValido) return <NaoEncontradaPage />
  return <Detalhe id={idNumero} />
}

function Detalhe({ id }: { id: number }) {
  const localizacao = useLocalizacao()
  const { dados: unidade, erro, carregando, recarregar } = useUnidade(id, localizacao.coords)

  if (erro?.status === 404) return <NaoEncontradaPage mensagem="Essa unidade não existe ou foi removida." />

  const voltar = (
    <Link to="/" className="btn btn-secundario" aria-label="Voltar à lista">
      <Icone nome="voltar" tamanho={16} /> <span className="oculto-mobile">Voltar à lista</span>
    </Link>
  )

  if (carregando) {
    return (
      <Casca titulo="Unidade" acoes={voltar}>
        <ListaEsqueleto quantidade={2} />
      </Casca>
    )
  }

  if (!unidade) {
    return (
      <Casca titulo="Unidade" acoes={voltar}>
        <MensagemErro mensagem={erro?.message ?? 'Erro desconhecido.'} aoTentarNovamente={recarregar} />
      </Casca>
    )
  }

  const temTotal = unidade.tempo_total_min !== null
  const deslocamento = unidade.deslocamento_min ?? 0
  const somaBarra = deslocamento + unidade.espera_min
  const larguraDeslocamento = somaBarra > 0 ? (deslocamento / somaBarra) * 100 : 0
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${unidade.latitude},${unidade.longitude}`

  return (
    <Casca titulo={unidade.nome} acoes={voltar}>
      <section className={`cartao ${styles.cabecalho}`}>
        <div>
          <div className={styles.selos}>
            {unidade.aberta ? <SeloSituacao situacao={unidade.situacao} /> : <span className={styles.fechada}>Fechada agora</span>}
            {unidade.atualizado_ha_min !== null && (
              <span className={styles.atualizado}>
                <Icone nome="relogio" tamanho={14} /> Atualizado {formatarHaMinutos(unidade.atualizado_ha_min)}
              </span>
            )}
          </div>
          <h2>{unidade.nome}</h2>
          {unidade.endereco && (
            <p className={styles.endereco}>
              <Icone nome="pin" tamanho={16} /> {unidade.endereco}
            </p>
          )}
        </div>
        <a className="btn btn-primario" href={rota} target="_blank" rel="noreferrer">
          <Icone nome="navegar" tamanho={16} /> Abrir rota no Google Maps
        </a>
      </section>

      {unidade.desatualizado && <AvisoDesatualizado minutos={unidade.atualizado_ha_min} />}

      <ul className={styles.numeros}>
        <li className={`cartao ${styles.numero} ${styles.numeroDestaque}`}>
          <span>{temTotal ? 'Tempo total estimado' : 'Espera estimada'}</span>
          <strong>
            {unidade.aberta ? formatarAprox(unidade.tempo_total_min ?? unidade.espera_min) : '—'}
          </strong>
          <small>{temTotal ? 'deslocamento + espera' : 'sem somar o deslocamento'}</small>
        </li>
        <li className={`cartao ${styles.numero}`}>
          <span>Na fila agora</span>
          <strong>{formatarPessoas(unidade.fila)}</strong>
          <small>senhas aguardando</small>
        </li>
        <li className={`cartao ${styles.numero}`}>
          <span>Espera na fila</span>
          <strong>{formatarAprox(unidade.espera_min)}</strong>
          <small>fila × tempo médio de atendimento</small>
        </li>
        <li className={`cartao ${styles.numero}`}>
          <span>Distância</span>
          <strong>{unidade.distancia_km !== null ? formatarDistancia(unidade.distancia_km) : '—'}</strong>
          <small>{unidade.distancia_km !== null ? 'em linha reta' : 'ative a localização na lista'}</small>
        </li>
      </ul>

      {temTotal && unidade.aberta && (
        <section className={`cartao ${styles.composicao}`}>
          <h3>Como o tempo total foi composto</h3>
          <div
            className={styles.barra}
            role="img"
            aria-label={`${formatarMinutos(deslocamento)} de deslocamento e ${formatarMinutos(unidade.espera_min)} de espera`}
          >
            <span className={styles.trechoDeslocamento} style={{ width: `${larguraDeslocamento}%` }} />
            <span className={styles.trechoEspera} style={{ width: `${100 - larguraDeslocamento}%` }} />
          </div>
          <ul className={styles.legenda}>
            <li>
              <span className={styles.corDeslocamento} /> Deslocamento: <strong>{formatarAprox(deslocamento)}</strong>
            </li>
            <li>
              <span className={styles.corEspera} /> Espera: <strong>{formatarAprox(unidade.espera_min)}</strong>
            </li>
          </ul>
        </section>
      )}

      <p className={styles.rodape}>
        <Icone nome="info" tamanho={16} />
        <span>
          Valores aproximados. O deslocamento é em linha reta a 25 km/h e a espera usa o tempo médio dos últimos
          atendimentos. <Link to="/sobre">Entenda o cálculo</Link>.
        </span>
      </p>
    </Casca>
  )
}
