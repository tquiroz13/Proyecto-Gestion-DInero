const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Utilidad para hacer peticiones HTTP
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error en la petición');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== API de Gastos ====================

export const gastosAPI = {
  // Crear nuevo gasto
  crear: async (gasto) => {
    return fetchAPI('/gastos', {
      method: 'POST',
      body: JSON.stringify(gasto),
    });
  },
  
  // Obtener todos los gastos
  obtenerTodos: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.skip) params.append('skip', filtros.skip);
    if (filtros.limit) params.append('limit', filtros.limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/gastos${query}`);
  },
  
  // Obtener un gasto por ID
  obtenerPorId: async (id) => {
    return fetchAPI(`/gastos/${id}`);
  },
  
  // Eliminar gasto
  eliminar: async (id) => {
    return fetchAPI(`/gastos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== API de Presupuestos ====================

export const presupuestosAPI = {
  // Crear o actualizar presupuesto
  crear: async (presupuesto) => {
    return fetchAPI('/presupuestos', {
      method: 'POST',
      body: JSON.stringify(presupuesto),
    });
  },
  
  // Obtener presupuestos
  obtenerTodos: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.mes) params.append('mes', filtros.mes);
    if (filtros.año) params.append('año', filtros.año);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/presupuestos${query}`);
  },
  
  // Obtener resumen de presupuesto vs gastos
  obtenerResumen: async (mes, año) => {
    return fetchAPI(`/resumen/${mes}/${año}`);
  },
};

// ==================== Utilidades de Formato ====================

export const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cantidad);
};

export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const CATEGORIAS = [
  'Comida',
  'Fiesta',
  'Ropa',
  'Gastos Extras',
  'Transporte',
];

// Colores para cada categoría
export const COLORES_CATEGORIAS = {
  'Comida': '#FF6B6B',
  'Fiesta': '#A855F7',
  'Ropa': '#3B82F6',
  'Gastos Extras': '#F59E0B',
  'Transporte': '#10B981',
};
