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
| GET | `/students` | Lista de alunos (com filtros) |
| GET | `/students/{id}` | Detalhe do aluno + fatores |
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
- Features: 21 variáveis (acadêmicas, financeiras, demográficas)
- Dataset: 4424 registros, classes Dropout / Graduate
- Saída: score (0–1), nível (baixo/médio/alto), top 5 fatores explicativos
- Treino automático na primeira execução via `dataset.csv`

---

## Roteiro de Demo (4 minutos)

Veja [DEMO.md](DEMO.md)
