# EvasãoZero — Contexto Completo do Projeto

> Este documento é a fonte de verdade do projeto. Destina-se a qualquer agente de IA ou desenvolvedor que precise entender, dar manutenção ou evoluir o sistema sem ter acompanhado sua construção.

---

## 1. O que é o EvasãoZero

EvasãoZero é uma plataforma de **predição de evasão acadêmica** com IA. O objetivo é ajudar professores e gestores de instituições de ensino superior (IES) a identificar alunos com alto risco de abandonar o curso antes que isso aconteça, permitindo intervenções preventivas.

É um protótipo funcional construído para hackathon, com dados sintéticos baseados em um dataset real público de uma universidade portuguesa.

---

## 2. Arquitetura

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│        Frontend              │        │          Backend              │
│  Next.js 15 (App Router)    │◄──────►│   FastAPI + SQLite            │
│  Tailwind CSS + Zilla DS    │  REST  │   scikit-learn (LogReg)       │
│  Recharts (gráficos)        │        │   SQLAlchemy ORM              │
│  Phosphor Icons             │        │                              │
│  Vercel (deploy)            │        │   Railway (deploy)            │
└─────────────────────────────┘        └──────────────────────────────┘
```

### Comunicação frontend → backend

O Next.js usa `rewrites` em `next.config.js` para redirecionar `/api/*` para a URL do Railway (variável `NEXT_PUBLIC_API_URL`). Isso evita CORS no browser e centraliza a configuração de URL num único ponto.

```js
// next.config.js (resumo)
rewrites: () => [{ source: "/api/:path*", destination: `${backendUrl}/:path*` }]
```

---

## 3. Stack tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend framework | Next.js | 15.3.9 |
| Linguagem frontend | TypeScript | — |
| CSS | Tailwind CSS + design tokens customizados | — |
| Design System | Zilla DS (Quero Educação) | via CSS vars |
| Ícones | @phosphor-icons/react | — |
| Gráficos | Recharts | — |
| Backend framework | FastAPI | — |
| ORM | SQLAlchemy | — |
| Banco de dados | SQLite (arquivo `dropout.db`) | — |
| ML | scikit-learn | — |
| Deploy frontend | Vercel | — |
| Deploy backend | Railway | — |

---

## 4. Estrutura de arquivos

```
Hackaton/
├── backend/
│   ├── main.py           # Todos os endpoints FastAPI
│   ├── ml_model.py       # Treinamento, predição e explicabilidade
│   ├── models.py         # SQLAlchemy models (Student, Course, PredictionLog)
│   ├── database.py       # Sessão e engine do SQLAlchemy
│   ├── seed.py           # Popula o banco com dados sintéticos
│   ├── dataset.csv       # Dataset original (4424 linhas, universidade portuguesa)
│   ├── dropout_model.pkl # Modelo serializado (gerado automaticamente)
│   ├── model_metrics.json # Métricas de validação do modelo (gerado automaticamente)
│   ├── dropout.db        # Banco SQLite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                      # Tela de login / seleção de perfil
│   │   │   ├── dashboard/professor/page.tsx  # Dashboard do professor
│   │   │   ├── dashboard/ies/page.tsx        # Dashboard institucional
│   │   │   └── student/[id]/page.tsx         # Detalhe do aluno
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── RiskBadge.tsx
│   │   └── lib/
│   │       └── api.ts     # Funções fetch para todos os endpoints
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── .npmrc             # legacy-peer-deps=true (React 19 compat)
├── dataset.csv
├── teste_alunos.csv       # CSV de exemplo para importação
└── CONTEXT.md             # Este arquivo
```

---

## 5. Modelo de dados (banco)

### Tabela `courses`
| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer PK | — |
| name | String | Nome do curso (ex: "Engenharia de Software") |
| period | String | "Manhã" ou "Noite" |

### Tabela `students`
| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer PK | — |
| name | String | Nome do aluno |
| email | String | Email |
| course_id | FK → courses | Curso ao qual pertence |
| marital_status | Integer | Estado civil (código numérico) |
| application_mode | Integer | Modo de candidatura |
| application_order | Integer | Ordem de candidatura |
| daytime_attendance | Integer | 1 = diurno, 0 = noturno |
| previous_qualification | Integer | Tipo de qualificação anterior |
| displaced | Integer | 1 = estudante deslocado |
| educational_special_needs | Integer | 1 = necessidades especiais |
| debtor | Integer | 1 = devedor |
| tuition_fees_up_to_date | Integer | 1 = mensalidade em dia |
| gender | Integer | 1 = masculino, 0 = feminino |
| scholarship_holder | Integer | 1 = bolsista |
| age_at_enrollment | Integer | Idade na matrícula |
| curricular_units_1st_sem_enrolled | Integer | Disciplinas matriculadas 1º sem |
| curricular_units_1st_sem_approved | Integer | Disciplinas aprovadas 1º sem |
| curricular_units_1st_sem_grade | Float | Nota média 1º sem (escala 0–20) |
| curricular_units_2nd_sem_enrolled | Integer | Disciplinas matriculadas 2º sem |
| curricular_units_2nd_sem_approved | Integer | Disciplinas aprovadas 2º sem |
| curricular_units_2nd_sem_grade | Float | Nota média 2º sem (escala 0–20) |
| unemployment_rate | Float | Taxa de desemprego (contexto econômico) |
| inflation_rate | Float | Taxa de inflação |
| gdp | Float | PIB |
| risk_score | Float | Probabilidade de evasão (0.0 a 1.0) |
| risk_level | String | "alto", "médio" ou "baixo" |
| updated_at | DateTime | Última atualização da predição |
| actual_status | String | Feedback real: `active`, `dropout` ou `graduate` |
| status_updated_at | DateTime | Última atualização do feedback real |

### Tabela `prediction_logs`
| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer PK | — |
| student_id | FK → students | Aluno avaliado; pode ser nulo em predições avulsas |
| risk_score | Float | Score retornado pelo modelo |
| risk_level | String | Nível retornado pelo modelo |
| factors | String JSON | Top fatores explicativos da predição |
| model_version | String | Versão do modelo usada na predição |
| features | String JSON | Features exatas enviadas ao modelo |
| source | String | Origem: `api_predict`, `student_detail`, `csv_upload` ou `seed` |
| created_at | DateTime | Data do log |

---

## 6. Modelo de Machine Learning

### Dataset
- Fonte: dataset público de universidade portuguesa (~4424 registros)
- Alvo binário: `Dropout` vs `Graduate` (registros com status `Enrolled` são excluídos do treino)
- ~3630 linhas usadas para treino após filtro

### Pipeline
```
Entrada (20 features numéricas; gênero foi removido para reduzir viés)
    → StandardScaler (normaliza média=0, desvio=1)
    → LogisticRegression (max_iter=1000, class_weight="balanced", random_state=42)
    → predict_proba → probabilidade da classe "Dropout" (índice 1)
```

`class_weight="balanced"` compensa o desbalanceamento entre Dropout e Graduate no dataset.

### Validação do modelo
Durante o treino, o dataset filtrado é separado em split 80/20 estratificado (`random_state=42`).
O modelo é treinado no conjunto de treino e avaliado no conjunto de teste. As métricas são salvas em
`backend/model_metrics.json` e expostas em `GET /model/metrics`.

Métricas calculadas:
- ROC AUC
- Precision
- Recall
- F1-score
- Accuracy
- Matriz de confusão
- Comparação de thresholds (`0.35`, `0.50`, `0.65`) com precision, recall, F1 e taxa de alertas

### Classificação do risco
| Probabilidade | Nível |
|---|---|
| ≥ 0.65 | alto |
| ≥ 0.35 e < 0.65 | médio |
| < 0.35 | baixo |

### Serialização e versionamento
O modelo treinado é salvo em `backend/dropout_model.pkl` via `joblib`, e as métricas ficam em `backend/model_metrics.json`. Na primeira vez que o servidor sobe sem algum desses arquivos, ele treina automaticamente a partir de `dataset.csv`.

O JSON de métricas também guarda metadados de operação:
- `model.version` no formato `lr-YYYYMMDD-HHMMSS-hash`
- `model.trained_at`
- `model.dataset_hash`
- `model.dataset_path`
- `model.features`
- thresholds baixo/médio/alto

O retreinamento em ambiente rodando é manual via `POST /model/retrain`. Upload de CSV não retreina o modelo automaticamente; ele apenas recalcula os scores com a versão atual.

### Monitoramento e feedback real
O protótipo possui três camadas simples de operação pós-deploy:
- Logs auditáveis em `prediction_logs` para cada predição operacional.
- Feedback real em `students.actual_status`, atualizado via API ou CSV.
- Monitoramento básico de drift em `GET /model/monitoring`, comparando média, desvio, mínimo, máximo e nulos das features atuais contra o dataset de treino.

`GET /model/metrics` mostra métricas offline do split de validação. `GET /model/live-metrics` mostra métricas pós-deploy, calculadas apenas para alunos com `actual_status` igual a `dropout` ou `graduate`.

---

## 7. Cálculo de explicabilidade (fatores de risco)

Após obter a probabilidade, o sistema extrai os **5 fatores que mais contribuíram** para o score de cada aluno individualmente. O método:

```python
# 1. Escalonar as features do aluno (mesmo scaler do treino)
scaled = scaler.transform(X).flatten()

# 2. Multiplicar pelo coeficiente do modelo logístico
contributions = clf.coef_[0] * scaled
# contributions[i] = impacto da feature i no log-odds de evasão
# positivo → aumenta risco de evasão
# negativo → reduz risco de evasão

# 3. Ordenar por valor absoluto e pegar os 5 maiores
top_idx = np.argsort(np.abs(contributions))[::-1][:5]
```

Cada fator retornado tem:
- `feature`: nome legível em português
- `impact`: `"positivo"` (aumenta risco) ou `"negativo"` (reduz risco)
- `value`: valor bruto da feature para aquele aluno
- `contribution`: magnitude do impacto (número com sinal)

No frontend, a barra de cada fator é normalizada pelo maior `|contribution|` do aluno, tornando a visualização relativa e comparável entre alunos com escalas diferentes.

---

## 8. Endpoints da API

Todos os endpoints têm prefixo raiz `/`. O frontend os acessa via `/api/*` (rewrite Next.js).

| Método | Rota | Descrição |
|---|---|---|
| POST | `/predict/dropout` | Predição avulsa ou vinculada a `student_id`; sempre gera log |
| GET | `/students` | Lista todos os alunos. Aceita `?course_id=` e `?risk_level=` |
| GET | `/students/{id}` | Detalhe de um aluno com fatores explicativos; gera log `student_detail` |
| PATCH | `/students/{id}/status` | Atualiza `actual_status` (`active`, `dropout`, `graduate`) |
| GET | `/dashboard/professor` | KPIs + lista para a visão professor. Aceita `?course_id=` |
| GET | `/dashboard/ies` | KPIs + by_course + alertas + trend para visão institucional |
| GET | `/model/metrics` | Validação do modelo, matriz de confusão e justificativa dos thresholds |
| POST | `/model/retrain` | Retreina manualmente, recarrega cache e retorna nova versão |
| GET | `/model/monitoring` | Drift básico entre base atual e dataset de treino |
| GET | `/model/live-metrics` | Métricas com feedback real importado |
| POST | `/upload/csv` | Importa ou atualiza alunos via CSV |
| GET | `/health` | Health check |

### Resposta `/students/{id}` (exemplo resumido)
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@uni.edu.br",
  "course": "Engenharia de Software",
  "period": "Noite",
  "age_at_enrollment": 22,
  "risk_score": 0.82,
  "risk_level": "alto",
  "debtor": 1,
  "tuition_fees_up_to_date": 0,
  "scholarship_holder": 0,
  "curricular_units_1st_sem_approved": 2,
  "curricular_units_1st_sem_grade": 8.5,
  "curricular_units_2nd_sem_approved": 1,
  "curricular_units_2nd_sem_grade": 6.0,
  "factors": [
    { "feature": "Mensalidade em dia", "impact": "positivo", "value": 0.0, "contribution": 0.8231 },
    { "feature": "Disciplinas aprovadas (2º sem)", "impact": "positivo", "value": 1.0, "contribution": 0.6104 }
  ]
}
```

---

## 9. Importação via CSV

O endpoint `POST /upload/csv` aceita um arquivo `.csv` UTF-8 e processa linha a linha:

- **Se a linha tem `id` de um aluno existente**: atualiza as features e recalcula o score.
- **Se a linha não tem `id` (ou id desconhecido)**: cria um novo aluno. Requer coluna `name` ou `nome`. O curso é criado automaticamente se não existir (`course`/`curso` + `period`/`periodo`).
- **Linhas sem nome**: ignoradas (`skipped`).

A resposta retorna `{ created, updated, skipped, message }`.

### Colunas do CSV

Colunas de features usam exatamente os nomes originais do dataset (inglês com espaços e parênteses):

```
id, name, email, course, period,
Debtor, Tuition fees up to date, Scholarship holder, Age at enrollment,
Curricular units 1st sem (enrolled), Curricular units 1st sem (approved), Curricular units 1st sem (grade),
Curricular units 2nd sem (enrolled), Curricular units 2nd sem (approved), Curricular units 2nd sem (grade),
Marital status, Application mode, Application order, Daytime/evening attendance,
Previous qualification, Displaced, Educational special needs, Gender,
Unemployment rate, Inflation rate, GDP,
actual_status
```

As colunas financeiras e acadêmicas (Debtor, Tuition fees, Curricular units) são as mais relevantes para o modelo.

Para feedback real, o CSV também aceita `actual_status`, `status` ou `situacao`. Valores reconhecidos incluem `active`, `dropout`, `graduate`, `ativo`, `evadido`, `evasão`, `graduado` e `concluído`.

---

## 10. Perfis de usuário

O sistema não tem autenticação real. A seleção de perfil na tela de login grava `role` no `localStorage` e redireciona para o dashboard correspondente.

| Perfil | Rota | Foco |
|---|---|---|
| `professor` | `/dashboard/professor` | Lista de alunos da turma, filtros por risco/nome/curso, importação CSV |
| `ies` | `/dashboard/ies` | Visão agregada por curso, gráficos, alertas institucionais |

Qualquer dashboard verifica o `role` no `localStorage` e redireciona para `/` se não bater.

---

## 11. Design System (Zilla DS)

O design system da Quero Educação (Zilla DS) é aplicado via CSS custom properties definidas em `globals.css`.

### Tokens principais
| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#304ffe` | Cor principal (botões, links, destaques) |
| `--primary-light` | `#6574fe` | Hover de elementos primários |
| `--primary-lightest` | `#eef0ff` | Fundos de destaque suave |
| `--fog-50` a `--fog-900` | escala de cinza | Backgrounds, textos, bordas |
| `--attention-danger` | `#da1e28` | Risco alto, erros |
| `--attention-warning` | `#ffb005` | Risco médio, alertas |
| `--attention-success` | `#198038` | Risco baixo, sucesso |

### Classes de componente
| Classe | Descrição |
|---|---|
| `z-btn` | Botão base (pill shape, border-radius 999px) |
| `z-btn--primary` | Variante primária azul |
| `z-btn--ghost` | Variante transparente |
| `z-btn--sm` | Tamanho pequeno |
| `z-btn--block` | Largura total |
| `z-btn--lg` | Tamanho grande |
| `z-card` | Card branco com sombra e padding |
| `z-badge` | Badge/pílula |
| `z-badge--danger` | Badge vermelho |
| `z-badge--warning` | Badge amarelo |
| `z-badge--success` | Badge verde |
| `z-badge--primary` | Badge azul |
| `z-badge--neutral` | Badge cinza |

Fonte tipográfica: **Red Hat Text** (Google Fonts).

---

## 12. Dados sintéticos (seed)

O script `backend/seed.py` popula o banco com 100 alunos fictícios distribuídos em:
- 25 perfis **alto risco**: devedores, mensalidade em atraso, baixas notas, muitas reprovações
- 35 perfis **médio risco**: mistura de indicadores bons e ruins
- 40 perfis **baixo risco**: bolsistas, mensalidade em dia, notas altas, poucas reprovações

Os perfis são gerados com `random.seed(42)` para reprodutibilidade. Os valores das features são enviesados por perfil para que o modelo logístico classifique corretamente após predição.

---

## 13. Deploy

| Serviço | Plataforma | Branch | URL |
|---|---|---|---|
| Frontend | Vercel | `main` | https://hackatonbeelders.vercel.app |
| Backend | Railway | `main` | variável `NEXT_PUBLIC_API_URL` no Vercel |

O Vercel faz rebuild automático a cada push em `main`. O Railway faz redeploy automático do backend.

A variável de ambiente `NEXT_PUBLIC_API_URL` deve ser configurada no painel do Vercel com a URL base do Railway (sem barra final).

---

## 14. Limitações conhecidas (protótipo)

- **Sem autenticação real**: qualquer pessoa pode acessar qualquer perfil.
- **Tendência simulada**: o gráfico "Tendência (6 meses)" no dashboard IES usa valores calculados artificialmente a partir do rate atual (`base_rate ± delta`), não dados históricos reais.
- **SQLite em produção**: adequado para demo, não para produção com múltiplos usuários simultâneos.
- **Retreinamento sem aprovação avançada**: o backend expõe retreinamento manual, mas ainda não há workflow de revisão humana, rollback ou comparação entre versões antes de promover o novo modelo.
- **Monitoramento de drift simples**: compara estatísticas básicas de features, sem testes estatísticos, janelas temporais ou alerta automático.
- **Dataset desatualizado**: o dataset de treino é de uma universidade portuguesa com contexto socioeconômico diferente do Brasil.
