from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    period = Column(String, nullable=False)  # Manhã / Noite
    students = relationship("Student", back_populates="course_obj")


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"))
    course_obj = relationship("Course", back_populates="students")

    # Academic features (mapped from dataset columns)
    marital_status = Column(Integer, default=1)
    application_mode = Column(Integer, default=1)
    application_order = Column(Integer, default=1)
    daytime_attendance = Column(Integer, default=1)
    previous_qualification = Column(Integer, default=1)
    displaced = Column(Integer, default=0)
    educational_special_needs = Column(Integer, default=0)
    debtor = Column(Integer, default=0)
    tuition_fees_up_to_date = Column(Integer, default=1)
    gender = Column(Integer, default=1)
    scholarship_holder = Column(Integer, default=0)
    age_at_enrollment = Column(Integer, default=20)
    curricular_units_1st_sem_enrolled = Column(Integer, default=6)
    curricular_units_1st_sem_approved = Column(Integer, default=6)
    curricular_units_1st_sem_grade = Column(Float, default=12.0)
    curricular_units_2nd_sem_enrolled = Column(Integer, default=6)
    curricular_units_2nd_sem_approved = Column(Integer, default=6)
    curricular_units_2nd_sem_grade = Column(Float, default=12.0)
    unemployment_rate = Column(Float, default=10.0)
    inflation_rate = Column(Float, default=1.0)
    gdp = Column(Float, default=1.0)

    # Prediction results
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="baixo")  # baixo/médio/alto
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Real outcome feedback for post-deploy evaluation
    actual_status = Column(String, default="active")  # active/dropout/graduate
    status_updated_at = Column(DateTime)


class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    risk_score = Column(Float)
    risk_level = Column(String)
    factors = Column(String)  # JSON string
    model_version = Column(String)
    features = Column(String)  # JSON string
    source = Column(String, default="unknown")
    created_at = Column(DateTime, default=datetime.utcnow)
