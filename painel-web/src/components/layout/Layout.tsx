import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Icone, type NomeIcone } from '../ui/Icone'
import { Logo } from './Logo'
import styles from './Layout.module.css'

export interface ItemMenu {
  para: string
  rotulo: string
  icone: NomeIcone
  /** Só fica ativo na rota exata (usado no "/"). */
  exato?: boolean
  /** Abre em outra aba (ex.: tela de TV do simulador). */
  novaAba?: boolean
}

interface LayoutProps {
  /** Linha pequena abaixo do nome da marca. Ex.: "PAINEL DO CIDADÃO". */
  subtituloMarca: string
  itensMenu: ItemMenu[]
  /** Conteúdo fixo no fim do menu lateral (cartão do 192, troca de interface…). */
  rodapeMenu?: ReactNode
  /** Linha pequena acima do título da página. */
  eyebrow: string
  titulo: string
  /** Botões e indicadores do canto direito da barra superior. */
  acoes?: ReactNode
  children: ReactNode
}

/**
 * Casca das duas interfaces: menu lateral escuro + barra superior + conteúdo.
 * Este arquivo é igual no painel-web e no simulador-web; o que muda é o que
 * cada app passa nas props (ver Casca.tsx de cada app).
 */
export function Layout({
  subtituloMarca,
  itensMenu,
  rodapeMenu,
  eyebrow,
  titulo,
  acoes,
  children,
}: LayoutProps) {
  const { pathname } = useLocation()
  // O menu do celular só vale para a página em que foi aberto: ao navegar, fecha sozinho.
  const [abertoEm, setAbertoEm] = useState<string | null>(null)
  const menuAberto = abertoEm === pathname
  const abrirMenu = () => setAbertoEm(pathname)
  const fecharMenu = () => setAbertoEm(null)

  // Atualiza o título da aba do navegador.
  useEffect(() => {
    document.title = `${titulo} · UBSTrack`
  }, [titulo])

  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setAbertoEm(null)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  return (
    <div className={styles.casca}>
      {menuAberto && (
        <button
          type="button"
          className={styles.cortina}
          onClick={fecharMenu}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`${styles.menu} ${menuAberto ? styles.menuAberto : ''}`} aria-label="Menu lateral">
        <div className={styles.marca}>
          <Logo tamanho={40} />
          <div>
            <strong>UBSTrack</strong>
            <span>{subtituloMarca}</span>
          </div>
          <button
            type="button"
            className={styles.fecharMenu}
            onClick={fecharMenu}
            aria-label="Fechar menu"
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>

        <p className={styles.legendaMenu}>NAVEGAÇÃO</p>
        <nav className={styles.nav} aria-label="Principal">
          {itensMenu.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.exato}
              target={item.novaAba ? '_blank' : undefined}
              rel={item.novaAba ? 'noreferrer' : undefined}
              className={({ isActive }) => `${styles.itemMenu} ${isActive ? styles.itemAtivo : ''}`}
            >
              <Icone nome={item.icone} tamanho={18} />
              <span>{item.rotulo}</span>
              {item.novaAba && <Icone nome="externo" tamanho={14} className={styles.iconeExterno} />}
            </NavLink>
          ))}
        </nav>

        {rodapeMenu && <div className={styles.rodapeMenu}>{rodapeMenu}</div>}
      </aside>

      <div className={styles.principal}>
        <header className={styles.topo}>
          <button
            type="button"
            className={styles.abrirMenu}
            onClick={abrirMenu}
            aria-label="Abrir menu"
          >
            <Icone nome="menu" tamanho={22} />
          </button>
          <div className={styles.titulos}>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{titulo}</h1>
          </div>
          {acoes && <div className={styles.acoes}>{acoes}</div>}
        </header>

        <main className={styles.conteudo}>{children}</main>
      </div>
    </div>
  )
}
