import { Link } from 'react-router-dom'
import { Casca } from '../components/layout/Casca'
import { Icone, type NomeIcone } from '../components/ui/Icone'
import { SeloSituacao } from '../components/unidades/SeloSituacao'
import styles from './SobrePage.module.css'

interface Passo {
  icone: NomeIcone
  titulo: string
  texto: string
}

const PASSOS: Passo[] = [
  {
    icone: 'pessoas',
    titulo: '1. Quantas pessoas estão na fila',
    texto: 'Contamos as senhas que estão aguardando em cada unidade neste momento.',
  },
  {
    icone: 'relogio',
    titulo: '2. Quanto tempo leva cada atendimento',
    texto:
      'Usamos a média dos últimos 10 atendimentos finalizados. Sem histórico, assumimos 15 minutos.',
  },
  {
    icone: 'senha',
    titulo: '3. Espera estimada',
    texto: 'Fila × tempo médio. Sempre aparece como “aprox.”, nunca como um horário exato.',
  },
  {
    icone: 'navegar',
    titulo: '4. Deslocamento',
    texto:
      'Se você permitir a localização, calculamos a distância em linha reta e dividimos por 25 km/h.',
  },
  {
    icone: 'pulso',
    titulo: '5. Tempo total estimado',
    texto: 'Deslocamento + espera. É por ele que as unidades abertas são numeradas: 1º, 2º, 3º…',
  },
]

/** Explica a estimativa em linguagem simples (regras 3 a 9 do guia). */
export function SobrePage() {
  return (
    <Casca titulo="Como funciona">
      <section className={styles.intro}>
        <h2>Como calculamos a estimativa</h2>
        <p>
          O UBSTrack mostra as unidades de saúde de Sorocaba ordenadas pelo tempo total estimado. Ele{' '}
          <strong>informa, mas não recomenda</strong> nenhuma unidade e não substitui o atendimento de
          emergência.
        </p>
      </section>

      <ol className={styles.passos}>
        {PASSOS.map((passo) => (
          <li key={passo.titulo} className={`cartao ${styles.passo}`}>
            <span className={styles.icone}>
              <Icone nome={passo.icone} tamanho={20} />
            </span>
            <div>
              <h3>{passo.titulo}</h3>
              <p>{passo.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.duasColunas}>
        <section className={`cartao ${styles.bloco}`}>
          <h3>Situação da fila</h3>
          <p>A cor depende só da espera estimada:</p>
          <ul className={styles.faixas}>
            <li>
              <SeloSituacao situacao="baixa" /> até 30 min
            </li>
            <li>
              <SeloSituacao situacao="moderada" /> de 30 a 90 min
            </li>
            <li>
              <SeloSituacao situacao="alta" /> acima de 90 min
            </li>
          </ul>
        </section>

        <section className={`cartao ${styles.bloco}`}>
          <h3>Casos especiais</h3>
          <ul className={styles.lista}>
            <li>
              <strong>Unidade fechada:</strong> aparece no fim da lista e fica fora da numeração.
            </li>
            <li>
              <strong>Dados desatualizados:</strong> sem movimento há mais de 10 min, ganha um aviso e vai para
              o fim da lista.
            </li>
            <li>
              <strong>Sem localização:</strong> a lista é ordenada só pela espera, e a distância não entra na
              conta.
            </li>
          </ul>
        </section>
      </div>

      <section className={`cartao ${styles.alerta}`}>
        <span className={styles.iconeAlerta}>
          <Icone nome="telefone" tamanho={22} />
        </span>
        <div>
          <h3>Estimativas não garantem atendimento</h3>
          <p>
            Os valores mudam a cada minuto e dependem de quem chega à unidade. Em emergência, não use o painel:
            ligue <a href="tel:192">192 (SAMU)</a>.
          </p>
        </div>
      </section>

      <p className={styles.rodape}>
        Projeto acadêmico de Engenharia da Computação · Facens · 6º semestre (UPX). Os dados desta demonstração
        são simulados. <Link to="/">Voltar às unidades</Link>.
      </p>
    </Casca>
  )
}
