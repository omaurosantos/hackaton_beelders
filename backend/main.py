import json
import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, ensure_schema
from models import Student, Course, PredictionLog
from ml_model import (
    LOW_RISK_THRESHOLD,
    FEATURE_COLS,
    feature_stats_from_records,
    features_from_student,
    get_model_version,
    load_model_metrics,
    predict_dropout,
    reload_model,
    resolve_dataset_path,
    train_model,
    training_feature_stats,
)

ensure_schema()

app = FastAPI(title="EvasãoZero API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    marital_status: int = 1
    application_mode: int = 1
    application_order: int = 1
    daytime_attendance: int = 1
    previous_qualification: int = 1
    displaced: int = 0
    educational_special_needs: int = 0
    debtor: int = 0
    tuition_fees_up_to_date: int = 1
    scholarship_holder: int = 0
    age_at_enrollment: int = 20
    curricular_units_1st_sem_enrolled: int = 6
    curricular_units_1st_sem_approved: int = 6
    curricular_units_1st_sem_grade: float = 12.0
    curricular_units_2nd_sem_enrolled: int = 6
    curricular_units_2nd_sem_approved: int = 6
    curricular_units_2nd_sem_grade: float = 12.0
    unemployment_rate: float = 10.0
    inflation_rate: float = 1.0
    gdp: float = 1.0
    student_id: Optional[int] = None


class StudentOut(BaseModel):
    id: int
    name: str
    email: str
    course: str
    period: str
    risk_score: float
    risk_level: str
    age_at_enrollment: int
    debtor: int
    tuition_fees_up_to_date: int
    scholarship_holder: int
    curricular_units_1st_sem_enrolled: int
    curricular_units_1st_sem_approved: int
    curricular_units_1st_sem_grade: float
    curricular_units_2nd_sem_enrolled: int
    curricular_units_2nd_sem_approved: int
    curricular_units_2nd_sem_grade: float
    actual_status: str

    class Config:
        from_attributes = True


class StudentStatusRequest(BaseModel):
    actual_status: str


VALID_ACTUAL_STATUSES = {"active", "dropout", "graduate"}
STATUS_ALIASES = {
    "active": "active",
    "ativo": "active",
    "ativa": "active",
    "matriculado": "active",
    "matriculada": "active",
    "cursando": "active",
    "dropout": "dropout",
    "evadido": "dropout",
    "evadida": "dropout",
    "evasao": "dropout",
    "evasão": "dropout",
    "desistente": "dropout",
    "graduate": "graduate",
    "graduado": "graduate",
    "graduada": "graduate",
    "formado": "graduate",
    "formada": "graduate",
    "concluido": "graduate",
    "concluida": "graduate",
    "concluído": "graduate",
    "concluída": "graduate",
}


def _normalize_actual_status(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    return STATUS_ALIASES.get(normalized)


def _round(value: float) -> float:
    return round(float(value), 4)


def _binary_metrics(y_true: list[int], y_pred: list[int]) -> dict:
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    accuracy = (tp + tn) / len(y_true) if y_true else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    return {
        "precision": _round(precision),
        "recall": _round(recall),
        "f1": _round(f1),
        "accuracy": _round(accuracy),
        "alert_rate": _round(sum(y_pred) / len(y_pred)) if y_pred else 0.0,
        "confusion_matrix": {
            "true_negative": tn,
            "false_positive": fp,
            "false_negative": fn,
            "true_positive": tp,
        },
    }


def _request_to_features(req: PredictRequest) -> dict:
    features = req.model_dump(exclude={"student_id"})
    return {
        "Marital status": features["marital_status"],
        "Application mode": features["application_mode"],
        "Application order": features["application_order"],
        "Daytime/evening attendance": features["daytime_attendance"],
        "Previous qualification": features["previous_qualification"],
        "Displaced": features["displaced"],
        "Educational special needs": features["educational_special_needs"],
        "Debtor": features["debtor"],
        "Tuition fees up to date": features["tuition_fees_up_to_date"],
        "Scholarship holder": features["scholarship_holder"],
        "Age at enrollment": features["age_at_enrollment"],
        "Curricular units 1st sem (enrolled)": features["curricular_units_1st_sem_enrolled"],
        "Curricular units 1st sem (approved)": features["curricular_units_1st_sem_approved"],
        "Curricular units 1st sem (grade)": features["curricular_units_1st_sem_grade"],
        "Curricular units 2nd sem (enrolled)": features["curricular_units_2nd_sem_enrolled"],
        "Curricular units 2nd sem (approved)": features["curricular_units_2nd_sem_approved"],
        "Curricular units 2nd sem (grade)": features["curricular_units_2nd_sem_grade"],
        "Unemployment rate": features["unemployment_rate"],
        "Inflation rate": features["inflation_rate"],
        "GDP": features["gdp"],
    }


def _apply_request_fields(student: Student, req: PredictRequest):
    features = req.model_dump(exclude={"student_id"})
    for key, value in features.items():
        setattr(student, key, value)


def run_and_log_prediction(
    db: Session,
    student: Optional[Student],
    source: str,
    features: Optional[dict] = None,
) -> dict:
    features = features or features_from_student(student)
    result = predict_dropout(features)

    if student:
        student.risk_score = result["score"]
        student.risk_level = result["risk_level"]
        student.updated_at = datetime.utcnow()

    db.add(PredictionLog(
        student_id=student.id if student else None,
        model_version=get_model_version(),
        risk_score=result["score"],
        risk_level=result["risk_level"],
        factors=json.dumps(result["factors"], ensure_ascii=False),
        features=json.dumps(features, ensure_ascii=False),
        source=source,
    ))
    return result


# ── Predict ───────────────────────────────────────────────────────────────────

@app.post("/predict/dropout")
def predict_endpoint(req: PredictRequest, db: Session = Depends(get_db)):
    mapped = _request_to_features(req)
    student = None
    if req.student_id:
        student = db.query(Student).filter(Student.id == req.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        _apply_request_fields(student, req)

    result = run_and_log_prediction(db, student, source="api_predict", features=mapped)
    db.commit()

    return result


@app.get("/model/metrics")
def model_metrics():
    return load_model_metrics()


@app.post("/model/retrain")
def retrain_model():
    dataset_path = resolve_dataset_path()
    metrics = train_model(dataset_path)
    reload_model()
    model = metrics.get("model", {})
    validation = metrics.get("validation", {})
    return {
        "model_version": model.get("version"),
        "trained_at": model.get("trained_at"),
        "dataset_rows": model.get("dataset_rows"),
        "dataset_hash": model.get("dataset_hash"),
        "validation": {
            "roc_auc": validation.get("roc_auc"),
            "precision": validation.get("precision"),
            "recall": validation.get("recall"),
            "f1": validation.get("f1"),
            "accuracy": validation.get("accuracy"),
        },
    }


@app.get("/model/monitoring")
def model_monitoring(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    current_records = [features_from_student(student) for student in students]
    train_stats = training_feature_stats()
    current_stats = feature_stats_from_records(current_records)

    features = []
    alerts = 0
    for col in FEATURE_COLS:
        train_mean = train_stats[col]["mean"]
        current_mean = current_stats[col]["mean"]
        relative_change = None
        reasons = []

        if train_mean is not None and current_mean is not None:
            denominator = max(abs(train_mean), 1e-9)
            relative_change = _round(abs(current_mean - train_mean) / denominator)
            if relative_change > 0.3:
                reasons.append("mean_shift")

        missing_rate = current_stats[col]["missing_rate"]
        if missing_rate is not None and missing_rate > 0.1:
            reasons.append("missing_values")

        status = "alert" if reasons else "ok"
        if status == "alert":
            alerts += 1

        features.append({
            "feature": col,
            "train": train_stats[col],
            "current": current_stats[col],
            "train_mean": train_mean,
            "current_mean": current_mean,
            "relative_mean_change": relative_change,
            "status": status,
            "reasons": reasons,
        })

    return {
        "model_version": get_model_version(),
        "students_analyzed": len(students),
        "alerts": alerts,
        "features": features,
    }


@app.get("/model/live-metrics")
def model_live_metrics(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    evaluated = [s for s in students if s.actual_status in {"dropout", "graduate"}]
    y_true = [1 if s.actual_status == "dropout" else 0 for s in evaluated]
    y_pred = [
        1 if s.risk_level in {"médio", "medio", "alto"} or s.risk_score >= LOW_RISK_THRESHOLD else 0
        for s in evaluated
    ]
    last_prediction_at = max(
        (s.updated_at for s in evaluated if s.updated_at),
        default=None,
    )

    return {
        "model_version": get_model_version(),
        "threshold": LOW_RISK_THRESHOLD,
        "evaluated_students": len(evaluated),
        "students_without_feedback": len(students) - len(evaluated),
        "last_prediction_at": last_prediction_at.isoformat() + "Z" if last_prediction_at else None,
        **_binary_metrics(y_true, y_pred),
    }


# ── Student detail ────────────────────────────────────────────────────────────

@app.get("/students/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    result = run_and_log_prediction(db, student, source="student_detail")
    db.commit()

    course = db.query(Course).filter(Course.id == student.course_id).first()
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "course": course.name if course else "",
        "period": course.period if course else "",
        "age_at_enrollment": student.age_at_enrollment,
        "risk_score": result["score"],
        "risk_level": result["risk_level"],
        "factors": result["factors"],
        "debtor": student.debtor,
        "tuition_fees_up_to_date": student.tuition_fees_up_to_date,
        "scholarship_holder": student.scholarship_holder,
        "curricular_units_1st_sem_enrolled": student.curricular_units_1st_sem_enrolled,
        "curricular_units_1st_sem_approved": student.curricular_units_1st_sem_approved,
        "curricular_units_1st_sem_grade": student.curricular_units_1st_sem_grade,
        "curricular_units_2nd_sem_enrolled": student.curricular_units_2nd_sem_enrolled,
        "curricular_units_2nd_sem_approved": student.curricular_units_2nd_sem_approved,
        "curricular_units_2nd_sem_grade": student.curricular_units_2nd_sem_grade,
        "actual_status": student.actual_status,
        "status_updated_at": student.status_updated_at.isoformat() + "Z" if student.status_updated_at else None,
    }


@app.patch("/students/{student_id}/status")
def update_student_status(
    student_id: int,
    req: StudentStatusRequest,
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    status = _normalize_actual_status(req.actual_status)
    if status not in VALID_ACTUAL_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid actual_status")

    student.actual_status = status
    student.status_updated_at = datetime.utcnow()
    db.commit()
    return {
        "id": student.id,
        "actual_status": student.actual_status,
        "status_updated_at": student.status_updated_at.isoformat() + "Z",
    }


@app.get("/students")
def list_students(
    course_id: Optional[int] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Student)
    if course_id:
        q = q.filter(Student.course_id == course_id)
    if risk_level:
        q = q.filter(Student.risk_level == risk_level)
    students = q.all()
    result = []
    for s in students:
        course = db.query(Course).filter(Course.id == s.course_id).first()
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "course": course.name if course else "",
            "period": course.period if course else "",
            "age_at_enrollment": s.age_at_enrollment,
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "debtor": s.debtor,
            "tuition_fees_up_to_date": s.tuition_fees_up_to_date,
            "scholarship_holder": s.scholarship_holder,
            "curricular_units_1st_sem_enrolled": s.curricular_units_1st_sem_enrolled,
            "curricular_units_1st_sem_approved": s.curricular_units_1st_sem_approved,
            "curricular_units_1st_sem_grade": s.curricular_units_1st_sem_grade,
            "curricular_units_2nd_sem_enrolled": s.curricular_units_2nd_sem_enrolled,
            "curricular_units_2nd_sem_approved": s.curricular_units_2nd_sem_approved,
            "curricular_units_2nd_sem_grade": s.curricular_units_2nd_sem_grade,
            "actual_status": s.actual_status,
            "status_updated_at": s.status_updated_at.isoformat() + "Z" if s.status_updated_at else None,
        })
    return result


# ── Dashboard Professor ───────────────────────────────────────────────────────

@app.get("/dashboard/professor")
def dashboard_professor(
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Student)
    if course_id:
        q = q.filter(Student.course_id == course_id)
    students = q.all()

    total = len(students)
    alto = sum(1 for s in students if s.risk_level == "alto")
    medio = sum(1 for s in students if s.risk_level == "médio")
    baixo = sum(1 for s in students if s.risk_level == "baixo")

    top10 = sorted(students, key=lambda s: s.risk_score, reverse=True)[:10]
    courses = {c.id: c for c in db.query(Course).all()}

    top10_out = [
        {
            "id": s.id,
            "name": s.name,
            "course": courses[s.course_id].name if s.course_id in courses else "",
            "risk_score": round(s.risk_score, 3),
            "risk_level": s.risk_level,
            "debtor": s.debtor,
            "tuition_up_to_date": s.tuition_fees_up_to_date,
            "grade_avg": round(
                (s.curricular_units_1st_sem_grade + s.curricular_units_2nd_sem_grade) / 2, 1
            ),
        }
        for s in top10
    ]

    courses_list = db.query(Course).all()
    return {
        "total": total,
        "alto_risco": alto,
        "medio_risco": medio,
        "baixo_risco": baixo,
        "taxa_risco": round((alto + medio) / total * 100, 1) if total else 0,
        "top10_criticos": top10_out,
        "courses": [{"id": c.id, "name": c.name, "period": c.period} for c in courses_list],
    }


# ── Dashboard IES ─────────────────────────────────────────────────────────────

@app.get("/dashboard/ies")
def dashboard_ies(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    students = db.query(Student).all()

    total = len(students)
    alto = sum(1 for s in students if s.risk_level == "alto")
    medio = sum(1 for s in students if s.risk_level == "médio")
    baixo = sum(1 for s in students if s.risk_level == "baixo")

    by_course = []
    for course in courses:
        cs = [s for s in students if s.course_id == course.id]
        if not cs:
            continue
        c_alto = sum(1 for s in cs if s.risk_level == "alto")
        c_medio = sum(1 for s in cs if s.risk_level == "médio")
        c_baixo = sum(1 for s in cs if s.risk_level == "baixo")
        avg_score = sum(s.risk_score for s in cs) / len(cs)
        by_course.append({
            "course": course.name,
            "period": course.period,
            "total": len(cs),
            "alto": c_alto,
            "medio": c_medio,
            "baixo": c_baixo,
            "avg_score": round(avg_score, 3),
            "taxa_risco": round((c_alto + c_medio) / len(cs) * 100, 1),
        })

    by_course.sort(key=lambda x: x["taxa_risco"], reverse=True)

    # Alerts: courses with >50% at risk
    alertas = [
        {
            "course": c["course"],
            "period": c["period"],
            "taxa_risco": c["taxa_risco"],
            "alto": c["alto"],
        }
        for c in by_course
        if c["taxa_risco"] > 40
    ]

    # Trend simulation (last 6 months mocked for demo)
    months = ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr"]
    base_rate = (alto + medio) / total * 100 if total else 0
    trend = [
        {"month": m, "taxa": round(max(0, base_rate + (i - 5) * 1.5), 1)}
        for i, m in enumerate(months)
    ]

    # ── Top institutional risk factors ───────────────────────────────────────
    # Aggregate the positive-impact factors across the top-100 highest-risk
    # students to surface what is systemically driving dropout risk.
    risk_students = [s for s in students if s.risk_level in ("alto", "médio")]
    sample = sorted(risk_students, key=lambda s: s.risk_score, reverse=True)[:100]
    factor_agg: dict[str, dict] = {}
    for s in sample:
        result = predict_dropout(features_from_student(s))
        for f in result["factors"]:
            if f["impact"] != "positivo":
                continue
            name = f["feature"]
            if name not in factor_agg:
                factor_agg[name] = {"count": 0, "total_contribution": 0.0}
            factor_agg[name]["count"] += 1
            factor_agg[name]["total_contribution"] += f["contribution"]

    top_factors = sorted(
        [
            {
                "factor": name,
                "affected_students": v["count"],
                "avg_contribution": round(v["total_contribution"] / v["count"], 4),
            }
            for name, v in factor_agg.items()
        ],
        key=lambda x: x["affected_students"],
        reverse=True,
    )[:5]

    return {
        "total": total,
        "alto_risco": alto,
        "medio_risco": medio,
        "baixo_risco": baixo,
        "taxa_risco_geral": round((alto + medio) / total * 100, 1) if total else 0,
        "by_course": by_course,
        "alertas": alertas,
        "trend": trend,
        "top_factors": top_factors,
    }


# ── CSV Upload ────────────────────────────────────────────────────────────────

FEATURE_ATTRS = {
    "Marital status": "marital_status",
    "Application mode": "application_mode",
    "Application order": "application_order",
    "Daytime/evening attendance": "daytime_attendance",
    "Previous qualification": "previous_qualification",
    "Displaced": "displaced",
    "Educational special needs": "educational_special_needs",
    "Debtor": "debtor",
    "Tuition fees up to date": "tuition_fees_up_to_date",
    "Scholarship holder": "scholarship_holder",
    "Age at enrollment": "age_at_enrollment",
    "Curricular units 1st sem (enrolled)": "curricular_units_1st_sem_enrolled",
    "Curricular units 1st sem (approved)": "curricular_units_1st_sem_approved",
    "Curricular units 1st sem (grade)": "curricular_units_1st_sem_grade",
    "Curricular units 2nd sem (enrolled)": "curricular_units_2nd_sem_enrolled",
    "Curricular units 2nd sem (approved)": "curricular_units_2nd_sem_approved",
    "Curricular units 2nd sem (grade)": "curricular_units_2nd_sem_grade",
    "Unemployment rate": "unemployment_rate",
    "Inflation rate": "inflation_rate",
    "GDP": "gdp",
}


def _apply_feature_cols(student: Student, row: dict):
    for col in FEATURE_COLS:
        attr = FEATURE_ATTRS[col]
        if col in row:
            try:
                val = float(row[col])
                setattr(student, attr, val)
            except (TypeError, ValueError):
                pass


def _apply_actual_status(student: Student, row: dict):
    raw_status = row.get("actual_status") or row.get("status") or row.get("situacao")
    status = _normalize_actual_status(raw_status)
    if status:
        student.actual_status = status
        student.status_updated_at = datetime.utcnow()


def _resolve_course(db: Session, course_name: str, period: str) -> int:
    name = (course_name or "").strip() or "Curso Importado"
    period = (period or "").strip() or "Manhã"
    course = db.query(Course).filter(Course.name == name, Course.period == period).first()
    if not course:
        course = Course(name=name, period=period)
        db.add(course)
        db.flush()
    return course.id


@app.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    updated = created = skipped = 0
    for row in reader:
        student_id = row.get("id") or row.get("student_id")

        if student_id:
            student = db.query(Student).filter(Student.id == int(student_id)).first()
        else:
            student = None

        if student:
            _apply_feature_cols(student, row)
            _apply_actual_status(student, row)
            updated += 1
        else:
            name = (row.get("name") or row.get("nome") or "").strip()
            email = (row.get("email") or "").strip()
            if not name:
                skipped += 1
                continue

            course_id = _resolve_course(db, row.get("course") or row.get("curso"), row.get("period") or row.get("periodo"))

            student = Student(
                name=name,
                email=email or f"{name.lower().replace(' ', '.')}@instituicao.edu.br",
                course_id=course_id,
            )
            db.add(student)
            db.flush()
            _apply_feature_cols(student, row)
            _apply_actual_status(student, row)
            created += 1

        run_and_log_prediction(db, student, source="csv_upload")

    db.commit()
    parts = []
    if created:
        parts.append(f"{created} criado(s)")
    if updated:
        parts.append(f"{updated} atualizado(s)")
    if skipped:
        parts.append(f"{skipped} ignorado(s) por falta de nome")
    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "message": ", ".join(parts) + " com sucesso." if parts else "Nenhuma linha processada.",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
