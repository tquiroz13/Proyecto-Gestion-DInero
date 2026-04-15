from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from io import BytesIO, StringIO
import json
import csv
import database
import schemas

# Inicializar FastAPI
app = FastAPI(title="Finanzas Personales API", version="1.0.0")

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar base de datos al iniciar la app
@app.on_event("startup")
def startup_event():
    database.init_db()

# ==================== ENDPOINTS DE GASTOS ====================

@app.post("/api/gastos", response_model=schemas.GastoResponse, status_code=201)
def crear_gasto(gasto: schemas.GastoCreate, db: Session = Depends(database.get_db)):
    """
    Crear un nuevo gasto
    """
    # Validar que la categoría sea válida
    categorias_validas = [cat.value for cat in database.CategoriaEnum]
    if gasto.categoria not in categorias_validas:
        raise HTTPException(
            status_code=400, 
            detail=f"Categoría inválida. Debe ser una de: {categorias_validas}"
        )
    
    # Crear gasto
    db_gasto = database.Gasto(
        monto=gasto.monto,
        categoria=gasto.categoria,
        descripcion=gasto.descripcion,
        fecha=gasto.fecha or datetime.now()
    )
    
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    
    return db_gasto

@app.get("/api/gastos", response_model=List[schemas.GastoResponse])
def obtener_gastos(
    skip: int = 0, 
    limit: int = 100,
    categoria: str = None,
    db: Session = Depends(database.get_db)
):
    """
    Obtener lista de gastos con paginación y filtros opcionales
    """
    query = db.query(database.Gasto)
    
    if categoria:
        query = query.filter(database.Gasto.categoria == categoria)
    
    gastos = query.order_by(database.Gasto.fecha.desc()).offset(skip).limit(limit).all()
    return gastos

@app.get("/api/gastos/{gasto_id}", response_model=schemas.GastoResponse)
def obtener_gasto(gasto_id: int, db: Session = Depends(database.get_db)):
    """
    Obtener un gasto específico por ID
    """
    gasto = db.query(database.Gasto).filter(database.Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return gasto

@app.delete("/api/gastos/{gasto_id}")
def eliminar_gasto(gasto_id: int, db: Session = Depends(database.get_db)):
    """
    Eliminar un gasto
    """
    gasto = db.query(database.Gasto).filter(database.Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    db.delete(gasto)
    db.commit()
    
    return {"message": "Gasto eliminado exitosamente"}

# ==================== ENDPOINTS DE PRESUPUESTOS ====================

@app.post("/api/presupuestos", response_model=schemas.PresupuestoResponse, status_code=201)
def crear_presupuesto(presupuesto: schemas.PresupuestoCreate, db: Session = Depends(database.get_db)):
    """
    Crear o actualizar presupuesto para una categoría
    """
    # Validar categoría
    categorias_validas = [cat.value for cat in database.CategoriaEnum]
    if presupuesto.categoria not in categorias_validas:
        raise HTTPException(
            status_code=400, 
            detail=f"Categoría inválida. Debe ser una de: {categorias_validas}"
        )
    
    # Buscar si ya existe presupuesto para esta categoría/mes/año
    db_presupuesto = db.query(database.Presupuesto).filter(
        database.Presupuesto.categoria == presupuesto.categoria,
        database.Presupuesto.mes == presupuesto.mes,
        database.Presupuesto.año == presupuesto.año
    ).first()
    
    if db_presupuesto:
        # Actualizar existente
        db_presupuesto.monto_mensual = presupuesto.monto_mensual
        db_presupuesto.updated_at = datetime.now()
    else:
        # Crear nuevo
        db_presupuesto = database.Presupuesto(**presupuesto.dict())
        db.add(db_presupuesto)
    
    db.commit()
    db.refresh(db_presupuesto)
    
    return db_presupuesto

@app.get("/api/presupuestos", response_model=List[schemas.PresupuestoResponse])
def obtener_presupuestos(
    mes: int = None,
    año: int = None,
    db: Session = Depends(database.get_db)
):
    """
    Obtener presupuestos, opcionalmente filtrados por mes/año
    """
    query = db.query(database.Presupuesto)
    
    if mes:
        query = query.filter(database.Presupuesto.mes == mes)
    if año:
        query = query.filter(database.Presupuesto.año == año)
    
    return query.all()

@app.get("/api/presupuestos", response_model=List[schemas.PresupuestoResponse])
def obtener_presupuestos(
    mes: int = None,
    año: int = None,  # ← Este puede quedarse con tilde, no está en la URL
    db: Session = Depends(database.get_db)
):
    """
    Obtener presupuestos, opcionalmente filtrados por mes/año
    """
    query = db.query(database.Presupuesto)
    
    if mes:
        query = query.filter(database.Presupuesto.mes == mes)
    if año:
        query = query.filter(database.Presupuesto.año == año)
    
    return query.all()

@app.get("/api/resumen/{mes}/{anio}", response_model=List[schemas.ResumenCategoria])
def obtener_resumen(mes: int, anio: int, db: Session = Depends(database.get_db)):
    #                              ^^^^^ ✅ Cambiar a "anio"
    """
    Obtener resumen de presupuesto vs gastos para cada categoría en un mes específico
    """
    from sqlalchemy import func, extract
    from calendar import monthrange
    
    # Obtener primer y último día del mes
    _, ultimo_dia = monthrange(anio, mes)
    fecha_inicio = datetime(anio, mes, 1)
    fecha_fin = datetime(anio, mes, ultimo_dia, 23, 59, 59)
    
    # Obtener todas las categorías
    categorias = [cat.value for cat in database.CategoriaEnum]
    resumen = []
    
    for categoria in categorias:
        # Obtener presupuesto
        presupuesto = db.query(database.Presupuesto).filter(
            database.Presupuesto.categoria == categoria,
            database.Presupuesto.mes == mes,
            database.Presupuesto.año == anio  # ✅ Cambiar a "anio"
        ).first()
        
        monto_presupuesto = presupuesto.monto_mensual if presupuesto else 0
        
        # Calcular gastos del mes
        gastos_total = db.query(func.sum(database.Gasto.monto)).filter(
            database.Gasto.categoria == categoria,
            database.Gasto.fecha >= fecha_inicio,
            database.Gasto.fecha <= fecha_fin
        ).scalar() or 0
        
        restante = monto_presupuesto - gastos_total
        porcentaje = (gastos_total / monto_presupuesto * 100) if monto_presupuesto > 0 else 0
        
        resumen.append(schemas.ResumenCategoria(
            categoria=categoria,
            presupuesto=monto_presupuesto,
            gastado=gastos_total,
            restante=restante,
            porcentaje_usado=round(porcentaje, 2)
        ))
    
    return resumen

# ==================== ENDPOINT DE SALUD ====================

@app.get("/")
def root():
    return {
        "message": "API de Finanzas Personales",
        "version": "1.0.0",
        "endpoints": {
            "gastos": "/api/gastos",
            "presupuestos": "/api/presupuestos",
            "resumen": "/api/resumen/{mes}/{año}"
        }
    }
# ==================== ENDPOINTS PARA N8N ====================

@app.get("/api/n8n/gastos-mes")
def obtener_gastos_para_n8n(mes: int, año: int, db: Session = Depends(database.get_db)):
    """
    Endpoint para n8n: Obtener todos los gastos de un mes específico
    Formato simplificado para fácil procesamiento en n8n
    """
    from calendar import monthrange
    
    _, ultimo_dia = monthrange(año, mes)
    fecha_inicio = datetime(año, mes, 1)
    fecha_fin = datetime(año, mes, ultimo_dia, 23, 59, 59)
    
    gastos = db.query(database.Gasto).filter(
        database.Gasto.fecha >= fecha_inicio,
        database.Gasto.fecha <= fecha_fin
    ).all()
    
    # Formato simplificado para n8n
    gastos_formateados = []
    for gasto in gastos:
        gastos_formateados.append({
            "id": gasto.id,
            "fecha": gasto.fecha.strftime("%Y-%m-%d"),
            "categoria": gasto.categoria,
            "monto": float(gasto.monto),
            "descripcion": gasto.descripcion or "",
            "mes": mes,
            "año": año
        })
    
    return {
        "mes": mes,
        "año": año,
        "total_gastos": len(gastos_formateados),
        "monto_total": sum(g["monto"] for g in gastos_formateados),
        "gastos": gastos_formateados
    }

@app.get("/api/n8n/resumen-mensual")
def obtener_resumen_mensual_n8n(mes: int, año: int, db: Session = Depends(database.get_db)):
    """
    Endpoint para n8n: Resumen agregado por categoría
    Ideal para crear reportes en Excel
    """
    from sqlalchemy import func
    from calendar import monthrange
    
    _, ultimo_dia = monthrange(año, mes)
    fecha_inicio = datetime(año, mes, 1)
    fecha_fin = datetime(año, mes, ultimo_dia, 23, 59, 59)
    
    # Obtener presupuestos
    presupuestos = db.query(database.Presupuesto).filter(
        database.Presupuesto.mes == mes,
        database.Presupuesto.año == año
    ).all()
    
    presupuestos_dict = {p.categoria: float(p.monto_mensual) for p in presupuestos}
    
    # Obtener gastos agrupados por categoría
    categorias = [cat.value for cat in database.CategoriaEnum]
    resumen = []
    
    for categoria in categorias:
        gastos_total = db.query(func.sum(database.Gasto.monto)).filter(
            database.Gasto.categoria == categoria,
            database.Gasto.fecha >= fecha_inicio,
            database.Gasto.fecha <= fecha_fin
        ).scalar() or 0
        
        presupuesto = presupuestos_dict.get(categoria, 0)
        restante = presupuesto - float(gastos_total)
        porcentaje = (float(gastos_total) / presupuesto * 100) if presupuesto > 0 else 0
        
        resumen.append({
            "categoria": categoria,
            "presupuesto": presupuesto,
            "gastado": float(gastos_total),
            "restante": restante,
            "porcentaje_usado": round(porcentaje, 2),
            "estado": "excedido" if porcentaje > 100 else "normal"
        })
    
    return {
        "mes": mes,
        "año": año,
        "fecha_generacion": datetime.now().isoformat(),
        "resumen_categorias": resumen,
        "totales": {
            "presupuesto_total": sum(r["presupuesto"] for r in resumen),
            "gastado_total": sum(r["gastado"] for r in resumen),
            "restante_total": sum(r["restante"] for r in resumen)
        }
    }

@app.post("/api/n8n/webhook-gasto")
def webhook_crear_gasto(
    categoria: str,
    monto: float,
    descripcion: str = None,
    fecha: str = None,
    db: Session = Depends(database.get_db)
):
    """
    Webhook para n8n: Crear gasto desde fuentes externas
    Permite que n8n cree gastos automáticamente (ej: desde emails, mensajes, etc)
    """
    # Validar categoría
    categorias_validas = [cat.value for cat in database.CategoriaEnum]
    if categoria not in categorias_validas:
        raise HTTPException(
            status_code=400,
            detail=f"Categoría inválida. Opciones: {categorias_validas}"
        )
    
    # Parsear fecha si viene como string
    if fecha:
        try:
            fecha_obj = datetime.fromisoformat(fecha.replace('Z', '+00:00'))
        except:
            fecha_obj = datetime.now()
    else:
        fecha_obj = datetime.now()
    
    # Crear gasto
    gasto = database.Gasto(
        monto=monto,
        categoria=categoria,
        descripcion=descripcion,
        fecha=fecha_obj
    )
    
    db.add(gasto)
    db.commit()
    db.refresh(gasto)
    
    return {
        "success": True,
        "message": "Gasto creado desde n8n",
        "gasto": {
            "id": gasto.id,
            "categoria": gasto.categoria,
            "monto": float(gasto.monto),
            "descripcion": gasto.descripcion,
            "fecha": gasto.fecha.isoformat()
        }
    }

@app.get("/api/n8n/categorias")
def obtener_categorias_n8n():
    """
    Endpoint simple para que n8n conozca las categorías disponibles
    """
    categorias = [cat.value for cat in database.CategoriaEnum]
    return {
        "categorias": categorias,
        "total": len(categorias)
    }

# ==================== EXPORTACIÓN FORMATO CSV ====================

@app.get("/api/export/gastos-csv")
def exportar_gastos_csv(mes: int = None, año: int = None, db: Session = Depends(database.get_db)):
    """
    Exportar gastos a formato CSV para Excel
    Compatible con n8n y descarga directa
    """
    import csv
    from io import StringIO
    
    query = db.query(database.Gasto)
    
    # Filtrar por mes/año si se proporciona
    if mes and año:
        from calendar import monthrange
        _, ultimo_dia = monthrange(año, mes)
        fecha_inicio = datetime(año, mes, 1)
        fecha_fin = datetime(año, mes, ultimo_dia, 23, 59, 59)
        query = query.filter(
            database.Gasto.fecha >= fecha_inicio,
            database.Gasto.fecha <= fecha_fin
        )
    
    gastos = query.order_by(database.Gasto.fecha.desc()).all()
    
    # Crear CSV en memoria
    output = StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow(['ID', 'Fecha', 'Categoría', 'Monto (€)', 'Descripción'])
    
    # Datos
    for gasto in gastos:
        writer.writerow([
            gasto.id,
            gasto.fecha.strftime("%Y-%m-%d"),
            gasto.categoria,
            f"{gasto.monto:.2f}",
            gasto.descripcion or ""
        ])
    
    # Preparar respuesta
    output.seek(0)
    filename = f"gastos_{año}_{mes:02d}.csv" if mes and año else "gastos_todos.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@app.get("/health")
def health_check():
    return {"status": "OK"}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)