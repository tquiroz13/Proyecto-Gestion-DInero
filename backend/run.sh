#!/bin/bash

echo "🚀 Iniciando servidor FastAPI..."
echo "📍 Backend corriendo en: http://localhost:8000"
echo "📚 Documentación API en: http://localhost:8000/docs"
echo ""

cd "$(dirname "$0")"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
