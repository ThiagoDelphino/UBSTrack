## O que foi feito

<!-- Resumo em 2 ou 3 linhas. O que muda para quem usa o sistema? -->

## Card do Trello

<!-- Link do card -->

## Tipo de mudança

- [ ] feat — funcionalidade nova
- [ ] fix — correção de bug
- [ ] refactor — reorganização sem mudar comportamento
- [ ] test — testes
- [ ] docs — documentação
- [ ] chore / build / ci — configuração, Docker, dependências

## Área afetada

- [ ] painel-api
- [ ] simulador-api
- [ ] painel-web
- [ ] simulador-web
- [ ] database (models / migrations / seeds)
- [ ] docs / infra

## Como testar

<!-- Passo a passo para o revisor ver funcionando -->
1.
2.
3.

## Prints (se mudou tela)

<!-- Arraste as imagens aqui -->

## Observações para o revisor

<!-- Pontos de atenção, dúvidas, decisões tomadas. Apague se não houver. -->

---

## Checklist do autor

- [ ] Título do PR no padrão `tipo(escopo): descrição`
- [ ] Branch atualizada com a `develop` e sem conflitos
- [ ] Testei localmente
- [ ] Regra nova no `domain/` tem teste
- [ ] Se mudei o banco: `models.py` e migration estão juntos neste PR
- [ ] Sem senhas, chaves ou `.env` no código
- [ ] Atualizei a documentação, se precisava

## Checklist do revisor

- [ ] O código faz o que o card pede
- [ ] Está na camada certa (regra no `domain/`, SQL nos `repositories/`, chamadas de API nos `services/` do front)
- [ ] Nomes claros e sem código comentado esquecido
- [ ] Casos de erro tratados (API fora do ar, lista vazia, sem histórico, GPS negado)
- [ ] Rodei a branch na minha máquina, quando o PR muda comportamento