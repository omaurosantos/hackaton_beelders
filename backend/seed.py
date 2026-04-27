"""Popula o banco com dados fictícios realistas baseados no dataset."""
import random
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
from models import Course, Student
from ml_model import predict_dropout, features_from_student

random.seed(42)

COURSE_NAMES = [
    ("Engenharia de Software", "Noite"),
    ("Administração", "Manhã"),
    ("Ciência da Computação", "Noite"),
    ("Pedagogia", "Manhã"),
    ("Direito", "Noite"),
    ("Enfermagem", "Manhã"),
]

FIRST_NAMES = [
    "Ana", "Bruno", "Carla", "Diego", "Elena", "Fábio", "Giovanna",
    "Henrique", "Isabela", "João", "Karen", "Lucas", "Mariana", "Nicolas",
    "Olivia", "Pedro", "Queila", "Rafael", "Sara", "Thiago", "Ursula",
    "Victor", "Wanda", "Xavier", "Yasmin", "Zé", "Alice", "Bernardo",
    "Camila", "Daniel", "Elisa", "Felipe", "Gabriela", "Hugo", "Inês",
]

LAST_NAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa",
    "Ferreira", "Rodrigues", "Almeida", "Nascimento", "Gomes", "Martins",
    "Araújo", "Melo", "Ribeiro", "Carvalho", "Fernandes", "Mendes",
]


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def make_student_features(profile: str) -> dict:
    """Generate features biased toward a dropout profile or safe profile."""
    if profile == "high_risk":
        return dict(
            debtor=random.choice([0, 1, 1]),
            tuition_fees_up_to_date=random.choice([0, 0, 1]),
            scholarship_holder=0,
            age_at_enrollment=random.randint(22, 35),
            curricular_units_1st_sem_enrolled=random.randint(4, 7),
            curricular_units_1st_sem_approved=random.randint(0, 2),
            curricular_units_1st_sem_grade=round(random.uniform(0, 8), 1),
            curricular_units_2nd_sem_enrolled=random.randint(4, 7),
            curricular_units_2nd_sem_approved=random.randint(0, 2),
            curricular_units_2nd_sem_grade=round(random.uniform(0, 8), 1),
            displaced=random.choice([0, 1]),
            gender=random.choice([0, 1]),
            marital_status=random.choice([1, 2, 3]),
            application_mode=random.randint(1, 17),
            application_order=random.randint(1, 9),
            daytime_attendance=random.choice([0, 1]),
            previous_qualification=random.randint(1, 10),
            educational_special_needs=0,
            unemployment_rate=round(random.uniform(10, 17), 1),
            inflation_rate=round(random.uniform(-0.5, 3), 1),
            gdp=round(random.uniform(-4, 1), 2),
        )
    elif profile == "medium_risk":
        return dict(
            debtor=random.choice([0, 1]),
            tuition_fees_up_to_date=random.choice([0, 1]),
            scholarship_holder=random.choice([0, 1]),
            age_at_enrollment=random.randint(19, 28),
            curricular_units_1st_sem_enrolled=random.randint(5, 7),
            curricular_units_1st_sem_approved=random.randint(2, 4),
            curricular_units_1st_sem_grade=round(random.uniform(8, 12), 1),
            curricular_units_2nd_sem_enrolled=random.randint(5, 7),
            curricular_units_2nd_sem_approved=random.randint(2, 4),
            curricular_units_2nd_sem_grade=round(random.uniform(8, 12), 1),
            displaced=random.choice([0, 1]),
            gender=random.choice([0, 1]),
            marital_status=random.choice([1, 2]),
            application_mode=random.randint(1, 10),
            application_order=random.randint(1, 6),
            daytime_attendance=random.choice([0, 1]),
            previous_qualification=random.randint(1, 6),
            educational_special_needs=0,
            unemployment_rate=round(random.uniform(8, 13), 1),
            inflation_rate=round(random.uniform(0, 2), 1),
            gdp=round(random.uniform(-1, 2), 2),
        )
    else:  # low_risk
        return dict(
            debtor=0,
            tuition_fees_up_to_date=1,
            scholarship_holder=random.choice([0, 1]),
            age_at_enrollment=random.randint(17, 22),
            curricular_units_1st_sem_enrolled=random.randint(5, 7),
            curricular_units_1st_sem_approved=random.randint(5, 7),
            curricular_units_1st_sem_grade=round(random.uniform(12, 18), 1),
            curricular_units_2nd_sem_enrolled=random.randint(5, 7),
            curricular_units_2nd_sem_approved=random.randint(5, 7),
            curricular_units_2nd_sem_grade=round(random.uniform(12, 18), 1),
            displaced=0,
            gender=random.choice([0, 1]),
            marital_status=1,
            application_mode=random.randint(1, 5),
            application_order=random.randint(1, 3),
            daytime_attendance=1,
            previous_qualification=random.randint(1, 3),
            educational_special_needs=0,
            unemployment_rate=round(random.uniform(7, 11), 1),
            inflation_rate=round(random.uniform(0.5, 2), 1),
            gdp=round(random.uniform(0.5, 3), 2),
        )


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(Student).delete()
    db.query(Course).delete()
    db.commit()

    # Create courses
    courses = []
    for name, period in COURSE_NAMES:
        c = Course(name=name, period=period)
        db.add(c)
        courses.append(c)
    db.commit()

    # Create ~100 students distributed across risk profiles
    profiles = ["high_risk"] * 25 + ["medium_risk"] * 35 + ["low_risk"] * 40
    random.shuffle(profiles)

    for i, profile in enumerate(profiles):
        course = random.choice(courses)
        feats = make_student_features(profile)
        name = random_name()
        student = Student(
            name=name,
            email=f"{name.lower().replace(' ', '.')}{i}@edu.br",
            course_id=course.id,
            **feats,
        )
        db.add(student)
        db.flush()

        # Run prediction
        result = predict_dropout(features_from_student(student))
        student.risk_score = result["score"]
        student.risk_level = result["risk_level"]

    db.commit()
    db.close()
    print(f"Seeded {len(profiles)} students across {len(courses)} courses.")


if __name__ == "__main__":
    seed()
