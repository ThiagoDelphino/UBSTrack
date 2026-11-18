import { Icone } from '../ui/Icone'
import styles from './TrocaDeInterface.module.css'

interface TrocaDeInterfaceProps {
  rotulo: string
  descricao: string
  href: string
}

/** Link no menu para a outra interface (painel ↔ simulador). Igual nos dois apps. */
export function TrocaDeInterface({ rotulo, descricao, href }: TrocaDeInterfaceProps) {
  return (
    <a className={styles.link} href={href} target="_blank" rel="noreferrer">
      <span className={styles.texto}>
        <strong>{rotulo}</strong>
        <span>{descricao}</span>
      </span>
      <Icone nome="externo" tamanho={16} />
    </a>
  )
}
