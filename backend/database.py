from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum

# Crear base de datos SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./finanzas.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enum para categorías
class CategoriaEnum(str, enum.Enum):
    COMIDA = "Comida"
    FIESTA = "Fiesta"
    ROPA = "Ropa"
    GASTOS_EXTRAS = "Gastos Extras"
    TRANSPORTE = "Transporte"

# Modelo para Gastos
class Gasto(Base):
    __tablename__ = "gastos"
    
    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float, nullable=False)
    categoria = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    fecha = Column(DateTime, default=datetime.now, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

# Modelo para Presupuestos
class Presupuesto(Base):
    __tablename__ = "presupuestos"
    
    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(String, unique=True, nullable=False)
    monto_mensual = Column(Float, nullable=False)
    mes = Column(Integer, nullable=False)  # 1-12
    año = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

# Crear todas las tablas
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency para obtener la sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
