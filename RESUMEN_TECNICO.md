# 📚 RESUMEN TÉCNICO - App Finanzas Personales

## 🎯 ¿Qué Construimos?

Una aplicación full-stack para gestionar gastos personales con:
- **Backend**: API REST con Python y FastAPI
- **Frontend**: Interfaz web con React
- **Base de datos**: SQLite

---

## 🏗️ ARQUITECTURA GENERAL

```
Usuario → Frontend (React) → Backend (FastAPI) → Base de Datos (SQLite)
         ↑                   ↓
         └─── Peticiones HTTP ───┘
```

### ¿Cómo funciona?

1. El usuario interactúa con la interfaz (React)
2. El frontend hace peticiones HTTP al backend
3. El backend procesa la petición y consulta/modifica la base de datos
4. El backend responde al frontend con datos JSON
5. React actualiza la interfaz con los nuevos datos

---

## 🔧 BACKEND - FastAPI (Python)

### Archivos Creados:

#### 1. `database.py` - Modelos de Base de Datos

**¿Qué hace?**
Define la estructura de las tablas en la base de datos usando SQLAlchemy (ORM).

**Conceptos clave:**

- **ORM (Object-Relational Mapping)**: 
  - Permite trabajar con la BD usando objetos Python en lugar de SQL puro
  - Ejemplo: `db.query(Gasto).all()` en vez de `SELECT * FROM gastos`

- **Modelo `Gasto`**:
  ```python
  class Gasto(Base):
      id = Column(Integer, primary_key=True)
      monto = Column(Float, nullable=False)
      categoria = Column(String)
      # ...
  ```
  Cada atributo es una columna en la tabla SQL

- **Modelo `Presupuesto`**:
  Similar, pero para guardar presupuestos mensuales por categoría

- **Session/SessionLocal**:
  - Conexión a la base de datos
  - Permite hacer queries (consultas)

**¿Por qué usamos esto?**
- No escribimos SQL directamente
- Más seguro (previene SQL injection)
- Código más Pythonic y fácil de mantener

---

#### 2. `schemas.py` - Validación de Datos

**¿Qué hace?**
Define cómo deben verse los datos que entran y salen de la API usando Pydantic.

**Conceptos clave:**

- **Pydantic Models (Schemas)**:
  ```python
  class GastoCreate(BaseModel):
      monto: float = Field(..., gt=0)
      categoria: str
  ```
  - Valida automáticamente que `monto` sea mayor a 0
  - Si alguien envía texto en `monto`, rechaza la petición

- **Input vs Output Schemas**:
  - `GastoCreate`: Lo que el cliente envía
  - `GastoResponse`: Lo que la API responde
  - Pueden ser diferentes (ej: el ID lo asigna la BD)

**¿Por qué es importante?**
- Seguridad: No aceptamos datos inválidos
- Documentación automática: FastAPI genera docs con estos schemas
- Type safety: Sabemos exactamente qué tipo de datos esperar

---

#### 3. `main.py` - Servidor y Endpoints

**¿Qué hace?**
El corazón del backend: define todos los endpoints de la API.

**Conceptos clave:**

**A. API RESTful**

REST = Representational State Transfer (forma estándar de diseñar APIs)

Estructura de URL: `/api/recurso`

Verbos HTTP:
- `GET` → Leer datos
- `POST` → Crear nuevo
- `PUT/PATCH` → Actualizar
- `DELETE` → Eliminar

**B. Endpoints que Creamos**

```python
@app.post("/api/gastos")  # Crear gasto
def crear_gasto(gasto: GastoCreate, db: Session):
    # Validación automática por Pydantic
    # db inyectado automáticamente
    
    db_gasto = Gasto(**gasto.dict())
    db.add(db_gasto)
    db.commit()
    return db_gasto
```

Desglose:
1. `@app.post` → Decorador que registra la función como endpoint POST
2. `gasto: GastoCreate` → Pydantic valida el JSON recibido
3. `db: Session = Depends(get_db)` → Dependency injection (inyecta la conexión DB)
4. `db.add()` y `db.commit()` → Guardar en la base de datos
5. `return db_gasto` → FastAPI lo convierte automáticamente a JSON

**C. CORS Middleware**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # ...
)
```

**¿Qué es CORS?**
- Por seguridad, navegadores bloquean peticiones a dominios diferentes
- Frontend en `localhost:3000`, Backend en `localhost:8000` → diferente dominio
- CORS Middleware permite estas peticiones

**D. Códigos de Estado HTTP**

- `200` → OK
- `201` → Created (recurso creado exitosamente)
- `404` → Not Found
- `400` → Bad Request (error del cliente)
- `500` → Server Error

**E. Query Parameters y Path Parameters**

```python
@app.get("/api/gastos")
def obtener_gastos(skip: int = 0, categoria: str = None):
    # URL: /api/gastos?skip=10&categoria=Comida
    # skip y categoria son query parameters
```

```python
@app.get("/api/gastos/{gasto_id}")
def obtener_gasto(gasto_id: int):
    # URL: /api/gastos/5
    # gasto_id es path parameter
```

**F. Endpoint de Resumen (Avanzado)**

```python
@app.get("/api/resumen/{mes}/{año}")
def obtener_resumen(mes: int, año: int, db: Session):
    # Calcula presupuesto vs gastos gastados
    # Usa funciones SQL como SUM()
```

Este endpoint:
1. Obtiene el presupuesto del mes
2. Suma todos los gastos de ese mes en cada categoría
3. Calcula cuánto queda y el porcentaje usado
4. Retorna un resumen completo

---

## ⚛️ FRONTEND - React

### Archivos Creados:

#### 1. `utils/api.js` - Cliente de la API

**¿Qué hace?**
Funciones para comunicarse con el backend.

**Conceptos clave:**

**A. Fetch API**

```javascript
async function fetchAPI(endpoint, options) {
  const response = await fetch(url, config);
  return await response.json();
}
```

- `fetch()` → Función nativa del navegador para HTTP
- `async/await` → Manejo de operaciones asíncronas
- JavaScript no espera respuestas por defecto; async/await lo hace esperar

**B. Funciones Helper**

```javascript
export const gastosAPI = {
  crear: async (gasto) => {
    return fetchAPI('/gastos', {
      method: 'POST',
      body: JSON.stringify(gasto),
    });
  },
  // ...
};
```

Ventajas:
- Código organizado
- Reutilizable
- Fácil de testear

**C. Formateo de Datos**

```javascript
export const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cantidad);
};
```

`Intl.NumberFormat` → API del navegador para formatear números según idioma/región

---

#### 2. `components/AgregarGasto.jsx` - Formulario

**¿Qué hace?**
Componente para crear nuevos gastos.

**Conceptos clave:**

**A. Componentes Funcionales**

```javascript
export default function AgregarGasto({ onGastoCreado }) {
  // lógica del componente
  return <div>...</div>
}
```

- Función que retorna JSX (HTML + JavaScript)
- Recibe `props` (propiedades) como parámetros

**B. useState Hook**

```javascript
const [formData, setFormData] = useState({
  monto: '',
  categoria: '',
  // ...
});
```

**¿Qué es estado?**
- Datos que pueden cambiar y causan re-renderizado
- `formData` → valor actual
- `setFormData` → función para actualizar
- Cuando llamamos `setFormData`, React vuelve a dibujar el componente

**C. Formularios Controlados**

```javascript
<input
  value={formData.monto}
  onChange={(e) => setFormData({...formData, monto: e.target.value})}
/>
```

- El valor del input viene del estado (single source of truth)
- Cuando el usuario escribe, actualiza el estado
- React es responsable del valor en todo momento

**D. Event Handlers**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault(); // Previene reload de página
  // ... lógica
};
```

- Funciones que responden a eventos del usuario
- `e.preventDefault()` → Evita comportamiento por defecto del navegador

**E. Pasar Callbacks a Componentes Padres**

```javascript
// En AgregarGasto:
onGastoCreado(); // Llama a función del padre

// En App:
<AgregarGasto onGastoCreado={handleGastoCreado} />
```

Permite comunicación hijo → padre (React fluye datos hacia abajo pero callbacks hacia arriba)

---

#### 3. `components/ListaGastos.jsx` - Lista de Gastos

**Conceptos clave:**

**A. useEffect Hook**

```javascript
useEffect(() => {
  cargarGastos(); // Se ejecuta cuando el componente se monta
}, [filtroCategoria, actualizarLista]); 
// ↑ Dependencies: se re-ejecuta si cambian
```

**¿Qué es useEffect?**
- Hook para efectos secundarios (side effects)
- Llamadas a API, suscripciones, manipulación DOM
- Similar a `componentDidMount` en componentes de clase

**Dependencies Array:**
- `[]` → Solo se ejecuta al montar
- `[var1, var2]` → Se ejecuta cuando var1 o var2 cambian
- Sin array → Se ejecuta en cada render (¡cuidado!)

**B. Renderizado de Listas**

```javascript
{gastos.map((gasto) => (
  <div key={gasto.id}>
    {gasto.descripcion}
  </div>
))}
```

- `.map()` → Transforma array en JSX
- `key` → React necesita identificar cada elemento único (importante para performance)

**C. Conditional Rendering**

```javascript
{loading ? (
  <div>Cargando...</div>
) : (
  <div>Contenido</div>
)}
```

Renderiza diferentes cosas según condición

---

#### 4. `App.css` - Estilos

**Conceptos CSS Modernos Usados:**

**A. CSS Variables (Custom Properties)**

```css
:root {
  --color-bg: #0a0a0f;
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.card {
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}
```

Ventajas:
- Reutilizable
- Fácil cambiar tema
- Se pueden modificar con JavaScript

**B. CSS Grid**

```css
.gastos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
```

- Layout bidimensional (filas y columnas)
- `auto-fill` → Crea columnas automáticamente según espacio
- `minmax()` → Tamaño mínimo y máximo

**C. Flexbox**

```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

- Layout unidimensional (fila o columna)
- Perfecto para alinear elementos

**D. Animaciones y Transiciones**

```css
.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-2px);
}
```

- `transition` → Suaviza cambios de propiedades
- `cubic-bezier` → Curva de animación personalizada
- `:hover` → Pseudo-clase para estado hover

**E. CSS Gradients**

```css
background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
```

Degradados suaves entre colores

**F. Media Queries (Responsive)**

```css
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

Adapta diseño según tamaño de pantalla

---

## 🔄 FLUJO COMPLETO: Crear un Gasto

1. **Usuario llena formulario** → Estado de React se actualiza con cada tecla
2. **Usuario hace click en "Guardar"** → Se dispara `handleSubmit`
3. **Validación en frontend** → ¿Campos completos?
4. **Petición HTTP POST** → `gastosAPI.crear()` envía JSON al backend
5. **Backend recibe petición** → FastAPI ejecuta `crear_gasto()`
6. **Validación con Pydantic** → ¿Datos válidos?
7. **Guardar en base de datos** → SQLAlchemy crea registro en SQLite
8. **Respuesta al frontend** → FastAPI retorna el gasto creado
9. **Frontend actualiza UI** → `onGastoCreado()` refresca la lista
10. **Nueva petición GET** → Lista actualizada se obtiene del backend
11. **React renderiza** → Usuario ve el nuevo gasto en pantalla

---

## 🎨 DECISIONES DE DISEÑO

### ¿Por qué estos colores y estilos?

1. **Dark Theme**: Menos fatiga visual, moderno
2. **Gradientes**: Dan profundidad y dinamismo
3. **Fuentes Distintivas**: 
   - DM Serif Display (títulos) → Elegante, memorable
   - Plus Jakarta Sans (body) → Legible, profesional
4. **Colores por Categoría**: Identificación visual rápida
5. **Animaciones sutiles**: Feedback visual sin distraer
6. **Espaciado generoso**: Menos cluttered, más fácil de leer

### ¿Por qué evitar "AI slop"?

- Inter/Roboto son las fuentes más usadas → genérico
- Morado/gradiente típico de AI → cliché
- Diseño debe ser memorable y contextual

---

## 📊 CONCEPTOS AVANZADOS PARA ENTENDER

### 1. Asincronía en JavaScript

```javascript
// Síncrono (bloqueante):
const data = getData(); // Espera aquí
console.log(data);

// Asíncrono (no bloqueante):
getData().then(data => console.log(data));
// El código continúa sin esperar

// Con async/await (más legible):
const data = await getData();
console.log(data);
```

### 2. Promesas (Promises)

Una promesa es un objeto que representa un valor futuro.

Estados:
- Pending (pendiente)
- Fulfilled (completada)
- Rejected (rechazada)

```javascript
fetch('/api/gastos')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### 3. Dependency Injection (Backend)

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/gastos")
def get_gastos(db: Session = Depends(get_db)):
    # db inyectado automáticamente
```

FastAPI llama `get_db()` y pasa el resultado a la función.

Ventajas:
- No creamos conexiones manualmente
- Cierre automático de conexiones
- Código más limpio

### 4. Virtual DOM en React

React no actualiza el DOM directamente:

1. Cambio de estado → React crea nuevo Virtual DOM
2. React compara (diff) Virtual DOM antiguo vs nuevo
3. Calcula cambios mínimos necesarios
4. Actualiza solo lo necesario en DOM real

Por eso React es rápido incluso con muchas actualizaciones.

### 5. Normalización de Datos

En nuestra API, usamos IDs únicos para relacionar datos:

```
Gasto → categoria (string)
Presupuesto → categoria (string)
```

Mejor enfoque (para escalar):
```
Categoria → id, nombre
Gasto → categoria_id (foreign key)
```

Esto es "normalización" en bases de datos.

---

## 🚀 PRÓXIMOS PASOS PARA APRENDER

1. **Añade autenticación**: JWT tokens, login/register
2. **Mejora la BD**: PostgreSQL en vez de SQLite
3. **Tests**: pytest para backend, Jest para frontend
4. **Deploy**: Render/Railway para backend, Vercel/Netlify para frontend
5. **PWA**: Convierte en app instalable
6. **WebSockets**: Actualizaciones en tiempo real
7. **GraphQL**: Alternativa a REST

---

## 📚 RECURSOS RECOMENDADOS

### Backend:
- FastAPI docs: https://fastapi.tiangolo.com
- SQLAlchemy tutorial: https://docs.sqlalchemy.org/en/tutorial/
- Python async: https://realpython.com/async-io-python/

### Frontend:
- React docs: https://react.dev
- JavaScript moderno: https://javascript.info
- CSS Grid/Flexbox: https://css-tricks.com/snippets/css/complete-guide-grid/

### General:
- HTTP/REST: https://restfulapi.net
- Git workflow: https://www.atlassian.com/git/tutorials

---

## ✅ CHECKLIST DE CONCEPTOS QUE APRENDISTE

**Backend:**
- [ ] API RESTful design
- [ ] ORM (SQLAlchemy)
- [ ] Validación con Pydantic
- [ ] Dependency Injection
- [ ] CORS y seguridad
- [ ] Query parameters y path parameters
- [ ] Códigos de estado HTTP

**Frontend:**
- [ ] Componentes funcionales en React
- [ ] useState y useEffect hooks
- [ ] Fetch API y async/await
- [ ] Formularios controlados
- [ ] Renderizado condicional
- [ ] Props y callbacks
- [ ] CSS Grid y Flexbox
- [ ] CSS Variables
- [ ] Animaciones CSS

**General:**
- [ ] Arquitectura cliente-servidor
- [ ] JSON como formato de intercambio
- [ ] Asincronía en JavaScript
- [ ] Promesas
- [ ] Virtual DOM
- [ ] Responsive design
- [ ] Modern CSS

---

¡Felicidades! Has construido una aplicación full-stack completa. 🎉
