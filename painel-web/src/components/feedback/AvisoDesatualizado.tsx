import { formatarHaMinutos } from '../../utils/formatadores'
import { Icone } from '../ui/Icone'
import styles from './Feedback.module.css'

interface AvisoDesatualizadoProps {
  minutos: number | null
}

/** Regra 8: unidade sem movimento recente continua na lista, com este aviso. */
export function AvisoDesatualizado({ minutos }: AvisoDesatualizadoProps) {
  return (
    <p className={styles.desatualizado}>
      <Icone nome="alerta" tamanho={15} />
      <span>
        Sem dados recentes{minutos !== null ? ` (último movimento ${formatarHaMinutos(minutos)})` : ''}. A
        estimativa pode estar diferente da realidade.
      </span>
    </p>
  )
}
