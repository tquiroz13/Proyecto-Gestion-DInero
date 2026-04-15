# Agregar estos imports al inicio de main.py
from fastapi.responses import StreamingResponse
from io import BytesIO
import json
from datetime import datetime, timedelta

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
