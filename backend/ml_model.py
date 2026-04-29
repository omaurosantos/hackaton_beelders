import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

MODEL_PATH = "dropout_model.pkl"
METRICS_PATH = "model_metrics.json"
LOW_RISK_THRESHOLD = 0.35
HIGH_RISK_THRESHOLD = 0.65

FEATURE_COLS = [
    "Marital status",
    "Application mode",
    "Application order",
    "Daytime/evening attendance",
    "Previous qualification",
    "Displaced",
    "Educational special needs",
    "Debtor",
    "Tuition fees up to date",
    # "Gender" removido: uso de gênero como preditor introduz viés discriminatório
    "Scholarship holder",
    "Age at enrollment",
    "Curricular units 1st sem (enrolled)",
    "Curricular units 1st sem (approved)",
    "Curricular units 1st sem (grade)",
    "Curricular units 2nd sem (enrolled)",
    "Curricular units 2nd sem (approved)",
    "Curricular units 2nd sem (grade)",
    "Unemployment rate",
    "Inflation rate",
    "GDP",
]

FEATURE_LABELS = {
    "Marital status": "Estado civil",
    "Application mode": "Modo de candidatura",
    "Application order": "Ordem de candidatura",
    "Daytime/evening attendance": "Turno (dia/noite)",
    "Previous qualification": "Qualificação anterior",
    "Displaced": "Estudante deslocado",
    "Educational special needs": "Necessidades educativas especiais",
    "Debtor": "Devedor",
    "Tuition fees up to date": "Mensalidade em dia",
    "Scholarship holder": "Bolsista",
    "Age at enrollment": "Idade na matrícula",
    "Curricular units 1st sem (enrolled)": "Disciplinas matriculadas (1º sem)",
    "Curricular units 1st sem (approved)": "Disciplinas aprovadas (1º sem)",
    "Curricular units 1st sem (grade)": "Nota média (1º sem)",
    "Curricular units 2nd sem (enrolled)": "Disciplinas matriculadas (2º sem)",
    "Curricular units 2nd sem (approved)": "Disciplinas aprovadas (2º sem)",
    "Curricular units 2nd sem (grade)": "Nota média (2º sem)",
    "Unemployment rate": "Taxa de desemprego",
    "Inflation rate": "Taxa de inflação",
    "GDP": "PIB",
}


def _build_model() -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")),
    ])


def _round_metric(value: float) -> float:
    return round(float(value), 4)


def _classification_metrics(y_true, y_prob, threshold: float) -> dict:
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    return {
        "threshold": threshold,
        "precision": _round_metric(precision_score(y_true, y_pred, zero_division=0)),
        "recall": _round_metric(recall_score(y_true, y_pred, zero_division=0)),
        "f1": _round_metric(f1_score(y_true, y_pred, zero_division=0)),
        "accuracy": _round_metric(accuracy_score(y_true, y_pred)),
        "alert_rate": _round_metric(float(np.mean(y_pred))),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
        },
    }


def _save_metrics(model: Pipeline, X_test, y_test, dataset_size: int, train_size: int) -> None:
    y_prob = model.predict_proba(X_test)[:, 1]
    primary_metrics = _classification_metrics(y_test, y_prob, LOW_RISK_THRESHOLD)

    metrics = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "dataset": {
            "source": "dataset.csv",
            "total_rows_after_filter": dataset_size,
            "train_rows": train_size,
            "test_rows": int(len(y_test)),
            "target": "Dropout vs Graduate",
            "excluded_target": "Enrolled",
        },
        "validation": {
            "split": "80/20 estratificado",
            "random_state": 42,
            "roc_auc": _round_metric(roc_auc_score(y_test, y_prob)),
            **primary_metrics,
        },
        "thresholds": {
            "baixo": {
                "max_exclusive": LOW_RISK_THRESHOLD,
                "label": "Baixo risco",
            },
            "medio": {
                "min_inclusive": LOW_RISK_THRESHOLD,
                "max_exclusive": HIGH_RISK_THRESHOLD,
                "label": "Médio risco",
            },
            "alto": {
                "min_inclusive": HIGH_RISK_THRESHOLD,
                "label": "Alto risco",
            },
            "justification": (
                "O corte de 0.35 marca médio ou alto risco para priorizar recall e intervenção precoce. "
                "Em evasão acadêmica, perder um aluno em risco tende a custar mais do que acompanhar preventivamente "
                "um aluno que talvez não evadisse. O corte de 0.65 separa casos de alta prioridade."
            ),
        },
        "threshold_analysis": [
            _classification_metrics(y_test, y_prob, threshold)
            for threshold in [LOW_RISK_THRESHOLD, 0.5, HIGH_RISK_THRESHOLD]
        ],
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)


def train_model(dataset_path: str = "../dataset.csv") -> None:
    df = pd.read_csv(dataset_path)
    # Keep only Dropout vs Graduate (drop Enrolled for binary classification)
    df = df[df["Target"].isin(["Dropout", "Graduate"])].copy()
    df["label"] = (df["Target"] == "Dropout").astype(int)

    X = df[FEATURE_COLS].fillna(0)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = _build_model()
    model.fit(X_train, y_train)
    joblib.dump(model, MODEL_PATH)
    _save_metrics(model, X_test, y_test, dataset_size=len(df), train_size=len(X_train))
    print(f"Model trained and saved to {MODEL_PATH}")
    print(f"Model metrics saved to {METRICS_PATH}")


def load_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(METRICS_PATH):
        dataset_path = "../dataset.csv"
        if not os.path.exists(dataset_path):
            dataset_path = "dataset.csv"
        train_model(dataset_path)
    return joblib.load(MODEL_PATH)


def load_model_metrics() -> dict:
    if not os.path.exists(METRICS_PATH):
        load_model()
    with open(METRICS_PATH, encoding="utf-8") as f:
        return json.load(f)


_model = None


def get_model():
    global _model
    if _model is None:
        _model = load_model()
    return _model


def predict_dropout(features: dict) -> dict:
    model = get_model()
    row = [features.get(col, 0) for col in FEATURE_COLS]
    X = pd.DataFrame([row], columns=FEATURE_COLS)
    prob = float(model.predict_proba(X)[0][1])

    if prob >= HIGH_RISK_THRESHOLD:
        level = "alto"
    elif prob >= LOW_RISK_THRESHOLD:
        level = "médio"
    else:
        level = "baixo"

    # Extract top factors via logistic regression coefficients
    clf = model.named_steps["clf"]
    scaler = model.named_steps["scaler"]
    scaled = scaler.transform(X).flatten()
    contributions = clf.coef_[0] * scaled
    top_idx = np.argsort(np.abs(contributions))[::-1][:5]
    factors = []
    for idx in top_idx:
        col = FEATURE_COLS[idx]
        label = FEATURE_LABELS.get(col, col)
        impact = "positivo" if contributions[idx] > 0 else "negativo"
        factors.append({
            "feature": label,
            "impact": impact,
            "value": round(float(row[idx]), 2),
            "contribution": round(float(contributions[idx]), 4),
        })

    return {"score": round(prob, 4), "risk_level": level, "factors": factors}


def features_from_student(student) -> dict:
    return {
        "Marital status": student.marital_status,
        "Application mode": student.application_mode,
        "Application order": student.application_order,
        "Daytime/evening attendance": student.daytime_attendance,
        "Previous qualification": student.previous_qualification,
        "Displaced": student.displaced,
        "Educational special needs": student.educational_special_needs,
        "Debtor": student.debtor,
        "Tuition fees up to date": student.tuition_fees_up_to_date,
        "Scholarship holder": student.scholarship_holder,
        "Age at enrollment": student.age_at_enrollment,
        "Curricular units 1st sem (enrolled)": student.curricular_units_1st_sem_enrolled,
        "Curricular units 1st sem (approved)": student.curricular_units_1st_sem_approved,
        "Curricular units 1st sem (grade)": student.curricular_units_1st_sem_grade,
        "Curricular units 2nd sem (enrolled)": student.curricular_units_2nd_sem_enrolled,
        "Curricular units 2nd sem (approved)": student.curricular_units_2nd_sem_approved,
        "Curricular units 2nd sem (grade)": student.curricular_units_2nd_sem_grade,
        "Unemployment rate": student.unemployment_rate,
        "Inflation rate": student.inflation_rate,
        "GDP": student.gdp,
    }
