import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

MODEL_PATH = "dropout_model.pkl"

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
    "Gender",
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
    "Gender": "Gênero",
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


def train_model(dataset_path: str = "../dataset.csv") -> None:
    df = pd.read_csv(dataset_path)
    # Keep only Dropout vs Graduate (drop Enrolled for binary classification)
    df = df[df["Target"].isin(["Dropout", "Graduate"])].copy()
    df["label"] = (df["Target"] == "Dropout").astype(int)

    X = df[FEATURE_COLS].fillna(0)
    y = df["label"]

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")),
    ])
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print(f"Model trained and saved to {MODEL_PATH}")


def load_model():
    if not os.path.exists(MODEL_PATH):
        dataset_path = "../dataset.csv"
        if not os.path.exists(dataset_path):
            dataset_path = "dataset.csv"
        train_model(dataset_path)
    return joblib.load(MODEL_PATH)


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

    if prob >= 0.65:
        level = "alto"
    elif prob >= 0.35:
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
        "Gender": student.gender,
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
