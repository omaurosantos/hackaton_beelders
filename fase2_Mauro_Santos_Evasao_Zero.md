# Especificação da Iniciativa – Fase 2

## 1. Identificação

- Nome do proponente: Mauro Santos
- Função: Analista de Produto
- Área: Produto
- Nome da iniciativa: Evasão Zero
- Data: 2026-04-28

---

## 2. Resumo executivo

O Evasão Zero é uma plataforma de inteligência de retenção para instituições de ensino superior, com foco em antecipar risco de evasão e orientar intervenções mais eficazes. A proposta parte de uma dor concreta do setor: muitas IES só conseguem reagir quando o aluno já está perto do abandono ou quando a perda já se concretizou. Isso gera impacto direto em receita, ociosidade operacional, reputação e permanência estudantil. A solução combina leitura preditiva de risco, explicação dos principais fatores associados e sugestões de intervenção para apoiar decisão humana. O público inicial são IES privadas e grupos educacionais, com uso principal por gestores de unidade e uso complementar por professores e coordenadores. A iniciativa merece avançar agora porque pode resolver dores reais das faculdades do grupo Marcas, validar valor em ambiente interno e, ao mesmo tempo, abrir uma nova linha de receita para a empresa. O MVP pode começar com ingestão por CSV e evoluir para integração por API com sistemas acadêmicos. O principal desafio não é apenas técnico, mas de confiança no score e adesão ao uso no trabalho cotidiano.

---

## 3. Problema ou oportunidade

- Descrição do problema: A evasão no ensino superior costuma ser percebida tarde demais, quando a chance de reversão já caiu e a instituição passa a lidar com perda consumada em vez de prevenção.
- Quem é afetado: IES privadas, grupos educacionais, gestores acadêmicos, coordenações, professores e indiretamente os próprios alunos.
- Como acontece hoje: As instituições monitoram sintomas como ausência de matrícula, falta de frequência, inadimplência ou não renovação de vínculo, tentam contato e oferecem alternativas, mas normalmente de forma reativa, dispersa e sem priorização preditiva.
- Consequências de não resolver: Perda de receita, desperdício operacional, ociosidade de vagas, desgaste reputacional, pior percepção de qualidade e menor capacidade de retenção e permanência estudantil.
- Evidências, sinais ou hipóteses relevantes: A dor é multifatorial, mas tende a pesar mais no financeiro e na reputação institucional; grande parte dos casos de evasão começa a se formar antes do abandono formal, o que abre espaço para intervenção antecipada se houver leitura confiável de risco.

---

## 4. Proposta de valor

- Promessa central da solução: O Evasão Zero ajuda IES a antecipar risco de evasão e orientar intervenção com mais precisão, protegendo receita e permanência estudantil.
- Benefício principal: Permitir ação antecipada e priorizada antes que a evasão se concretize.
- Benefícios secundários: Melhor alocação de esforço das equipes, maior previsibilidade na gestão de retenção, apoio à tomada de decisão, proteção de indicadores institucionais e possibilidade de nova receita para a empresa.
- Diferencial em relação ao estado atual: A solução conecta previsão de risco, explicação dos fatores e orientação de intervenção, enquanto o estado atual tende a ser reativo e baseado em sinais tardios e dispersos.
- Relação com negócio, estratégia ou operação: A iniciativa resolve uma dor real nas faculdades do grupo, cria espaço para validação interna e pode se tornar uma nova oferta comercial para IES privadas.

---

## 5. Público, mercado ou contexto de uso

- Usuários principais: Gestores de unidades e lideranças acadêmicas com visão macro de risco por curso, turma, unidade ou grupo.
- Beneficiários indiretos: Professores, coordenadores, áreas de permanência, gestão institucional e alunos que passam a receber atenção antecipada.
- Frequência esperada de uso: Uso recorrente semanal ou mensal, com maior intensidade em períodos críticos como início de semestre, rematrícula, inadimplência e queda de engajamento.
- Contexto em que a solução aparece: Rotinas de acompanhamento de permanência estudantil, priorização de casos, análise de cursos com maior risco e definição de ações de retenção.
- Alternativas atuais: Monitoramento manual, relatórios operacionais, iniciativas pontuais de contato, entrevistas de desistência e ações de retenção não priorizadas por score preditivo.
- Relevância ou tamanho aproximado da oportunidade: O problema é relevante para IES privadas e grupos educacionais porque evasão afeta receita, reputação e eficiência operacional; o recorte inicial mais estratégico é validar nas marcas do grupo, como Unialphaville e outras faculdades da empresa.

---

## 6. Solução proposta

- Descrição da solução: Plataforma de inteligência de retenção para IES que calcula risco de evasão, explica os fatores mais relevantes e sugere intervenções para apoiar ação humana.
- Como funciona em alto nível: A instituição envia ou integra dados de alunos, a plataforma processa esses sinais, calcula níveis de risco por aluno e por agrupamentos, apresenta visões macro e micro por perfil de usuário e apoia a definição de acompanhamento prioritário.
- Papel da IA: Identificar padrões de risco em grandes volumes de dados, combinando variáveis acadêmicas, financeiras e contextuais para gerar uma leitura preditiva que seria difícil obter de forma manual ou apenas reativa.
- O que entra na solução: Dados acadêmicos, financeiros, cadastrais e contextuais, inicialmente via CSV e futuramente via API em tempo quase real.
- O que sai da solução: Score de risco, classificação por nível, fatores explicativos, sugestões de intervenção, alertas e visões consolidadas por curso, turma, unidade ou grupo.
- Onde há participação humana: Interpretação dos alertas, validação contextual dos casos, decisão sobre intervenção e execução das ações de retenção.
- Onde há automação: Processamento dos dados, cálculo preditivo, priorização dos casos, geração de alertas e organização das informações por perfil e agrupamento.

---

## 7. Casos de uso principais

### Caso de uso 1
- Nome: Priorização de alunos em risco pelo professor
- Usuário/ator: Professor
- Situação: O professor acessa sua turma e precisa saber rapidamente quais alunos exigem atenção.
- Ação principal: Consultar dashboard, filtrar por curso e abrir o detalhe do aluno com maior score de risco.
- Resultado esperado: O professor identifica quem precisa de acompanhamento imediato e entende os fatores que estão elevando o risco.
- Valor gerado: Redução do tempo de triagem e maior precisão na atenção aos casos críticos.

### Caso de uso 2
- Nome: Gestão macro de risco pela IES
- Usuário/ator: Gestor de unidade ou liderança institucional
- Situação: A gestão precisa entender onde concentrar esforço e recursos de retenção.
- Ação principal: Analisar indicadores agregados por curso, unidade ou grupo, acompanhar alertas automáticos e comparar concentração de risco.
- Resultado esperado: A direção identifica áreas prioritárias e define ações de retenção com visão mais estratégica.
- Valor gerado: Melhor priorização institucional, proteção de receita e visão consolidada do problema.

### Caso de uso 3
- Nome: Apoio à intervenção orientada
- Usuário/ator: Coordenador ou professor
- Situação: Após identificar um caso de risco, o usuário precisa decidir como agir.
- Ação principal: Consultar os fatores explicativos e as sugestões de intervenção apresentadas pela plataforma.
- Resultado esperado: A equipe escolhe um encaminhamento mais coerente com o contexto do aluno, sem depender apenas de intuição.
- Valor gerado: Aumento da confiança na tomada de decisão e maior chance de ação útil e tempestiva.

---

## 8. Solução tecnológica

- Tipo de IA envolvida: Modelos preditivos para classificação/estimativa de risco, com camada de explicabilidade e recomendação de intervenção.
- Dados necessários: Dados acadêmicos, financeiros, cadastrais e contextuais, como desempenho por semestre, aprovação, inadimplência, bolsa, idade de ingresso, curso, turno e sinais externos relevantes.
- Fontes de dados: Bases institucionais das IES, extrações manuais por CSV no MVP e futuramente integrações com sistemas acadêmicos e financeiros.
- Integrações necessárias: No MVP, não obrigatórias além da importação estruturada de arquivo; em produção, integração por API com sistemas das IES.
- Sistemas impactados: Sistemas acadêmicos, financeiros, ambientes de gestão de permanência e possíveis rotinas de acompanhamento institucional.
- Necessidade de modelo/API externa: A previsão de risco pode ser construída com modelo próprio ajustado ao caso de uso; recomendações podem começar por regras orientadas por contexto ou evoluir com serviços adicionais, se necessário.
- Requisitos de segurança: Controle de acesso por perfil, proteção de dados pessoais, governança de compartilhamento, trilha de acesso, revisão de base legal e tratamento cuidadoso de dados potencialmente sensíveis.
- Dependências técnicas: Qualidade mínima dos dados, padronização das bases, integração segura com sistemas das IES e capacidade de monitorar desempenho do modelo.
- Primeira versão possível: MVP com upload de CSV, dashboards por perfil, score de risco, fatores explicativos, sugestões de intervenção e métricas básicas de validação do modelo.

---

## 9. Impacto interno para operação

- Mudanças de processo necessárias: Criar rotina de envio ou sincronização de dados, definir processo de acompanhamento dos alertas e padronizar resposta institucional aos casos prioritários.
- Equipes envolvidas: Produto, dados/tecnologia, lideranças acadêmicas, gestores das marcas, professores, coordenadores e áreas responsáveis por retenção.
- Novas responsabilidades: Acompanhar qualidade das bases, revisar score e indicadores, operar o fluxo de alertas e garantir que casos priorizados tenham encaminhamento.
- Treinamentos necessários: Uso da plataforma por perfil, leitura responsável dos scores, interpretação dos fatores explicativos e boas práticas de intervenção.
- Conteúdos ou dados a criar: Regras de governança, catálogo mínimo de dados, orientações de uso responsável e repertório inicial de intervenções sugeridas.
- Ferramentas ou fornecedores necessários: Infraestrutura de dados, camada de integração/API, mecanismos de autenticação e, se preciso, apoio jurídico/compliance para governança de dados.
- Dono operacional sugerido: Uma frente conjunta entre produto e negócio educacional, com patrocínio institucional das lideranças das marcas.
- Esforço operacional percebido: Médio, com maior carga inicial em governança, confiança no score e adoção do uso na rotina.

---

## 10. Riscos e mitigação

### Risco 1
- Descrição: Uso de dados pessoais e potencial tratamento de dados sensíveis de alunos.
- Tipo: Compliance / LGPD / segurança
- Impacto: Alto
- Probabilidade: Média
- Mitigação inicial: Limitar escopo dos dados, revisar base legal, definir perfis de acesso, registrar governança de compartilhamento e adotar controles de segurança desde o MVP.

### Risco 2
- Descrição: O modelo induzir equipes a agir de forma inadequada, enviesada ou simplista em relação ao aluno.
- Tipo: IA / operacional / reputacional
- Impacto: Alto
- Probabilidade: Média
- Mitigação inicial: Posicionar a solução como apoio à decisão, não como decisão automática; apresentar explicabilidade mínima, evitar linguagem determinista e exigir validação humana antes de qualquer ação.

### Risco 3
- Descrição: Baixa confiança no score e baixa adesão ao uso, fazendo a solução virar apenas mais um dashboard.
- Tipo: Adoção / operacional
- Impacto: Alto
- Probabilidade: Alta
- Mitigação inicial: Validar primeiro nas marcas internas, exibir métricas de desempenho do modelo, treinar usuários, definir rotina clara de uso e medir recorrência de acesso e uso dos alertas.

---

## 11. Métricas e critérios de sucesso

- Métrica principal: Confiança percebida no score de risco para priorização de casos.
- Métricas secundárias: Adesão ao uso recorrente, percentual de alertas efetivamente acompanhados, percepção de utilidade por perfil e evolução posterior de retenção.
- Indicadores de adoção: Frequência de acesso por perfil, uso recorrente por gestores e ponta, quantidade de consultas a detalhes do aluno e utilização dos alertas no fluxo de acompanhamento.
- Indicadores de qualidade: Precisão e recall do modelo, consistência dos fatores explicativos, estabilidade do score e percepção de coerência entre previsão e contexto real.
- Resultado mínimo esperado: Usuários-chave consideram o score confiável o suficiente para priorizar casos e incorporam a plataforma à rotina de análise.
- Sinal de sucesso em uma primeira versão: O piloto interno comprova confiança no score, uso recorrente e geração de acompanhamento ou intervenção a partir dos alertas.

---

## 12. Artefato de demonstração do “como”

Indique o tipo de artefato escolhido:

- Mock de sistema/produto

### Artefato

Roteiro de demonstração do mock do produto:

1. Login por perfil
   Mostrar acesso por dois perfis, Professor e IES, destacando que a plataforma adapta a visão conforme o papel do usuário.

2. Dashboard do Professor
   Exibir KPIs principais, distribuição de risco, filtro por curso e tabela de alunos para demonstrar como a ponta identifica rapidamente quem precisa de atenção.

3. Tela de detalhe do aluno
   Mostrar score de risco, fatores explicativos e sugestões de intervenção para evidenciar como a plataforma transforma previsão em ação orientada.

4. Dashboard IES
   Exibir métricas de validação do modelo, alertas automáticos, visão agregada por curso e tendência temporal para demonstrar valor de gestão e priorização institucional.

5. Encerramento
   Reforçar que a solução usa dados que a IES já coleta e que o próximo passo natural é integrar sistemas acadêmicos via API para operação mais contínua.

---

## 13. Plano sugerido de primeira versão

- Escopo da primeira versão: MVP com upload por CSV, login por perfil, dashboards para Professor e IES, score de risco, fatores explicativos, sugestões de intervenção e indicadores básicos de validação do modelo.
- O que fica fora da primeira versão: Integração em tempo real com sistemas das IES, automações complexas de workflow, personalização profunda por instituição e expansão comercial ampla fora do grupo.
- Hipóteses a validar: O score é percebido como confiável, a plataforma entra na rotina dos usuários e os alertas geram acompanhamento ou intervenção.
- Dependências antes de iniciar: Disponibilidade de bases mínimas de dados, alinhamento de governança, definição de responsáveis pelo piloto e acesso às marcas internas para validação.
- Próximo passo recomendado: Executar piloto nas faculdades do grupo Marcas, medir confiança no score e adesão ao uso e, com base nisso, preparar evolução para integração por API e expansão comercial.

---

## 14. Pitch final da iniciativa

O ensino superior convive com um problema recorrente: muitas instituições só percebem a evasão quando o aluno já está prestes a sair ou quando a perda já aconteceu. Isso afeta diretamente receita, reputação e eficiência operacional, além de limitar a capacidade de apoiar a permanência estudantil. O Evasão Zero nasce para enfrentar esse ponto com uma proposta clara: ajudar IES a antecipar risco de evasão e orientar intervenção com mais precisão, protegendo receita e permanência estudantil. A solução combina inteligência preditiva, explicação dos fatores de risco e apoio à ação, transformando um processo hoje reativo em uma capacidade mais previsível e acionável. O momento para avançar é agora porque a iniciativa pode resolver dores reais das faculdades do grupo Marcas, validar valor em ambiente interno e abrir uma nova linha de receita para a empresa. O impacto esperado é melhorar priorização, aumentar confiança na gestão da retenção e criar base para futura expansão como produto para outras IES privadas. A iniciativa merece avançar porque une relevância de problema, clareza de proposta, viabilidade de MVP e potencial estratégico de negócio.
