from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./dropout.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    migrations = {
        "students": [
            ("actual_status", "VARCHAR DEFAULT 'active'"),
            ("status_updated_at", "DATETIME"),
        ],
        "prediction_logs": [
            ("model_version", "VARCHAR"),
            ("features", "TEXT"),
            ("source", "VARCHAR DEFAULT 'unknown'"),
        ],
    }

    with engine.begin() as conn:
        for table, columns in migrations.items():
            if table not in tables:
                continue
            existing = {col["name"] for col in inspector.get_columns(table)}
            for name, definition in columns:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
