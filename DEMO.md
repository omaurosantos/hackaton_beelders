# Roteiro de Demo — EvasãoZero (4 minutos)

## Contexto (30 seg)
> "Evasão acadêmica custa R$ 9 bilhões/ano ao sistema de ensino superior brasileiro.
> O problema: as instituições só percebem que um aluno vai evadir DEPOIS que ele some.
> O EvasãoZero usa IA para identificar o risco ANTES, com tempo para intervir."

---

## 1. Login por perfil (20 seg)
- Abrir http://localhost:3000
- Mostrar os dois perfis disponíveis: **Professor** e **IES**
- Entrar como **Professor**

---

## 2. Dashboard do Professor (1 min)
- Destacar os 4 cards de KPI: total de alunos, alto risco, médio risco, baixo risco
- Mostrar a barra de distribuição de risco (vermelho/amarelo/verde)
- Usar o filtro de curso para isolar uma turma específica
- Ordenar a tabela e apontar: *"Em segundos o professor sabe quem precisa de atenção"*
- Clicar em **"Ver detalhes"** do aluno com maior score

---

## 3. Tela de Detalhe do Aluno (1 min)
- Mostrar o gauge de score (ex: 78% de risco)
- Explicar os fatores: *"O modelo mostra exatamente O QUÊ está puxando o risco"*
  - Ex: "Mensalidade atrasada + nota abaixo da média no 2º semestre"
- Mostrar as **Sugestões de Intervenção** geradas automaticamente
- Destacar: *"O professor não precisa adivinhar — o sistema diz o que fazer"*

---

## 4. Dashboard IES (1 min)
- Voltar, sair e entrar como **IES**
- Mostrar o gráfico de barras horizontal por curso
- Apontar o curso com maior taxa de risco no gráfico
- Mostrar os **Alertas automáticos** (cursos acima de 40% em risco)
- Mostrar a tendência dos últimos 6 meses
- Destacar: *"A direção vê o panorama geral e consegue priorizar recursos"*

---

## 5. Encerramento (30 seg)
> "Com dados que as IES já coletam — notas, frequência, situação financeira — 
> entregamos uma ferramenta pronta para uso que reduz evasão através de intervenção precoce.
> Próximo passo: integração com sistemas acadêmicos existentes (Totvs, SIG@) via API."

---

## Pontos de impacto para a banca
- Modelo treinado em dataset real (Kaggle, 4.424 alunos)
- Explicabilidade dos fatores (não é caixa-preta)
- Intervenções sugeridas baseadas nos dados do aluno
- Funciona 100% offline — sem dependências externas
