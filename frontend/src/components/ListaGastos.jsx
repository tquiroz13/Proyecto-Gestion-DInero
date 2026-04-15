import { useState, useEffect } from 'react';
import { Trash2, Calendar, Tag } from 'lucide-react';
import { gastosAPI, formatearMoneda, formatearFecha, COLORES_CATEGORIAS } from '../utils/api';

export default function ListaGastos({ actualizarLista }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const cargarGastos = async () => {
    setLoading(true);
    try {
      const filtros = filtroCategoria ? { categoria: filtroCategoria } : {};
      const data = await gastosAPI.obtenerTodos(filtros);
      setGastos(data);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGastos();
  }, [filtroCategoria, actualizarLista]);

  const eliminarGasto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    
    try {
      await gastosAPI.eliminar(id);
      cargarGastos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el gasto');
    }
  };

  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);

  if (loading) {
    return (
      <div className="lista-gastos-container">
        <div className="loading">Cargando gastos...</div>
      </div>
    );
  }

  return (
    <div className="lista-gastos-container">
      <div className="lista-header">
        <div>
          <h2>Tus Gastos</h2>
          <p className="total-gastos">Total: {formatearMoneda(totalGastos)}</p>
        </div>
        
        <select 
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todas las categorías</option>
          {Object.keys(COLORES_CATEGORIAS).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {gastos.length === 0 ? (
        <div className="empty-state">
          <p>No hay gastos registrados</p>
          <p className="empty-subtitle">Comienza agregando tu primer gasto arriba</p>
        </div>
      ) : (
        <div className="gastos-grid">
          {gastos.map((gasto) => (
            <div 
              key={gasto.id} 
              className="gasto-card"
              style={{ '--categoria-color': COLORES_CATEGORIAS[gasto.categoria] }}
            >
              <div className="gasto-header">
                <span className="categoria-badge">
                  <Tag size={14} />
                  {gasto.categoria}
                </span>
                <span className="gasto-monto">{formatearMoneda(gasto.monto)}</span>
              </div>
              
              {gasto.descripcion && (
                <p className="gasto-descripcion">{gasto.descripcion}</p>
              )}
              
              <div className="gasto-footer">
                <span className="gasto-fecha">
                  <Calendar size={14} />
                  {formatearFecha(gasto.fecha)}
                </span>
                <button 
                  className="btn-eliminar"
                  onClick={() => eliminarGasto(gasto.id)}
                  title="Eliminar gasto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
