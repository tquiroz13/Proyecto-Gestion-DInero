from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Schema para crear un gasto
class GastoCreate(BaseModel):
    monto: float = Field(..., gt=0, description="Monto debe ser mayor a 0")
    categoria: str = Field(..., description="Categoría del gasto")
    descripcion: Optional[str] = Field(None, max_length=200)
    fecha: Optional[datetime] = None

# Schema para respuesta de gasto
class GastoResponse(BaseModel):
    id: int
    monto: float
    categoria: str
    descripcion: Optional[str]
    fecha: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schema para crear/actualizar presupuesto
class PresupuestoCreate(BaseModel):
    categoria: str
    monto_mensual: float = Field(..., gt=0)
    mes: int = Field(..., ge=1, le=12)
    año: int = Field(..., ge=2020)

# Schema para respuesta de presupuesto
class PresupuestoResponse(BaseModel):
    id: int
    categoria: str
    monto_mensual: float
    mes: int
    año: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schema para resumen de categoría
class ResumenCategoria(BaseModel):
    categoria: str
    presupuesto: float
    gastado: float
    restante: float
    porcentaje_usado: float
