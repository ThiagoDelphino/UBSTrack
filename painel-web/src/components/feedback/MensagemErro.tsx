import { Icone } from '../ui/Icone'
import styles from './Feedback.module.css'

interface MensagemErroProps {
  titulo?: string
  mensagem: string
  aoTentarNovamente?: () => void
}

/** Estado de erro: mensagem clara e botão "tentar novamente". */
export function MensagemErro({
  titulo = 'Não foi possível carregar',
  mensagem,
  aoTentarNovamente,
}: MensagemErroProps) {
  return (
    <div className={`cartao ${styles.caixa}`} role="alert">
      <span className={`${styles.icone} ${styles.iconeErro}`}>
        <Icone nome="alerta" tamanho={24} />
      </span>
      <h2>{titulo}</h2>
      <p>{mensagem}</p>
      {aoTentarNovamente && (
        <button type="button" className="btn btn-primario" onClick={aoTentarNovamente}>
          <Icone nome="atualizar" tamanho={16} /> Tentar novamente
        </button>
      )}
    </div>
  )
}
