# EvasãoZero — Previsão de Evasão Acadêmica

Protótipo fullstack para hackathon. Identifica alunos em risco de evasão com IA (regressão logística treinada no dataset Kaggle) e apresenta dashboards acionáveis para Professores e IES.

---

## Estrutura

```
Hackaton/
├── backend/          FastAPI + SQLite + scikit-learn
├── frontend/         Next.js 14 + Tailwind + Recharts
├── dataset.csv       Dataset Kaggle (4424 registros)
└── docker-compose.yml
```

---

## Setup rápido (sem Docker)

### 1. Backend

```bash
cd backend

# Criar ambiente virtual
python3 -m venv .venv && source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Popular banco com dados fictícios (treina modelo automaticamente)
python seed.py

# Iniciar API
uvicorn main:app --reload --port 8000
```

API disponível em: http://localhost:8000  
Documentação Swagger: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

App disponível em: http://localhost:3000

---

## Setup com Docker

```bash
# Na raiz do projeto
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/predict/dropout` | Predição de risco de evasão |
| GET | `/dashboard/professor` | Métricas da turma |
| GET | `/dashboard/ies` | Métricas agregadas por curso |
| GET | `/model/metrics` | Métricas de validação do modelo |
| POST | `/model/retrain` | Retreinamento manual e controlado do modelo |
| GET | `/model/monitoring` | Monitoramento básico de drift das features |
| GET | `/model/live-metrics` | Métricas pós-deploy com feedback real |
| GET | `/students` | Lista de alunos (com filtros) |
| GET | `/students/{id}` | Detalhe do aluno + fatores |
| PATCH | `/students/{id}/status` | Atualiza resultado real do aluno |
| POST | `/upload/csv` | Atualizar base via CSV |
| GET | `/health` | Status da API |

---

## Perfis de acesso (demo)

| Perfil | Tela de entrada | Funcionalidades |
|--------|-----------------|-----------------|
| Professor | `/dashboard/professor` | Métricas da turma, top 10 críticos, filtros, detalhe do aluno |
| IES | `/dashboard/ies` | KPIs institucionais, gráfico por curso, alertas, tendência |

Login na página raiz (`/`) — sem senha, apenas seleção de perfil.

---

## Modelo de IA

- Algoritmo: Regressão Logística (scikit-learn)
- Features: 20 variáveis (acadêmicas, financeiras, demográficas; gênero foi removido para reduzir viés)
- Dataset: 4424 registros, classes Dropout / Graduate
- Validação: split 80/20 estratificado, com AUC, precision, recall, F1 e matriz de confusão
- Saída: score (0–1), nível (baixo/médio/alto), top 5 fatores explicativos
- Thresholds: baixo < 0,35; médio ≥ 0,35; alto ≥ 0,65
- Treino automático na primeira execução via `dataset.csv`
- Versionamento simples: cada treino salva `model_version`, data, hash do dataset e features em `model_metrics.json`

### Ciclo operacional de ML

- Toda predição gera log auditável em `prediction_logs`, com origem (`api_predict`, `student_detail`, `csv_upload`, `seed`), versão do modelo, features usadas, score, nível e fatores.
- O retreinamento é manual via `POST /model/retrain`; upload de CSV apenas recalcula scores com o modelo atual.
- O feedback real do aluno fica em `actual_status` (`active`, `dropout`, `graduate`) e pode ser atualizado via `PATCH /students/{id}/status` ou importado no CSV.
- `/model/metrics` mostra validação offline no holdout do dataset de treino.
- `/model/live-metrics` compara predições persistidas com `actual_status` real.
- `/model/monitoring` compara estatísticas das features atuais contra o dataset de treino e sinaliza drift simples.

---

## Roteiro de Demo (4 minutos)

Veja [DEMO.md](DEMO.md)
