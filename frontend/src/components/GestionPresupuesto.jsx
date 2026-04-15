import { useState, useEffect } from 'react';
import { DollarSign, Save, TrendingUp } from 'lucide-react';
import { presupuestosAPI, CATEGORIAS, COLORES_CATEGORIAS, formatearMoneda } from '../utils/api';

export default function GestionPresupuesto() {
  const [presupuestos, setPresupuestos] = useState({});
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Obtener mes y año actual
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1;
  const añoActual = fechaActual.getFullYear();

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  const cargarPresupuestos = async () => {
    try {
      const data = await presupuestosAPI.obtenerTodos({
        mes: mesActual,
        año: añoActual
      });
      
      // Convertir array a objeto para fácil acceso
      const presupuestosObj = {};
      data.forEach(p => {
        presupuestosObj[p.categoria] = p.monto_mensual;
      });
      
      setPresupuestos(presupuestosObj);
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
    }
  };

  const handleChange = (categoria, valor) => {
    setPresupuestos(prev => ({
      ...prev,
      [categoria]: valor === '' ? '' : parseFloat(valor) || 0
    }));
  };

  const guardarPresupuestos = async () => {
    setLoading(true);
    setMensaje('');
    
    try {
      // Guardar cada presupuesto
      for (const categoria of CATEGORIAS) {
        const monto = presupuestos[categoria] || 0;
        if (monto > 0) {
          await presupuestosAPI.crear({
            categoria,
            monto_mensual: monto,
            mes: mesActual,
            año: añoActual
          });
        }
      }
      
      setMensaje('✅ Presupuestos guardados exitosamente');
      setEditando(false);
      
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('❌ Error al guardar presupuestos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPresupuesto = Object.values(presupuestos).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  return (
    <div className="gestion-presupuesto-container">
      <div className="presupuesto-header">
        <div>
          <h2>
            <TrendingUp size={28} />
            Presupuesto Mensual
          </h2>
          <p className="presupuesto-periodo">
            {new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        {!editando ? (
          <button 
            className="btn-editar-presupuesto"
            onClick={() => setEditando(true)}
          >
            <DollarSign size={20} />
            Configurar Presupuesto
          </button>
        ) : (
          <button 
            className="btn-guardar-presupuesto"
            onClick={guardarPresupuestos}
            disabled={loading}
          >
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>

      {mensaje && (
        <div className={`mensaje-presupuesto ${mensaje.includes('✅') ? 'success' : 'error'}`}>
          {mensaje}
        </div>
      )}

      <div className="presupuestos-grid">
        {CATEGORIAS.map(categoria => (
          <div 
            key={categoria}
            className="presupuesto-card"
            style={{ '--categoria-color': COLORES_CATEGORIAS[categoria] }}
          >
            <div className="presupuesto-card-header">
              <span className="categoria-nombre">{categoria}</span>
              <div 
                className="categoria-indicator"
                style={{ background: COLORES_CATEGORIAS[categoria] }}
              />
            </div>
            
            {editando ? (
              <div className="input-presupuesto-wrapper">
                <span className="euro-symbol">€</span>
                <input
                  type="number"
                  className="input-presupuesto"
                  value={presupuestos[categoria] || ''}
                  onChange={(e) => handleChange(categoria, e.target.value)}
                  placeholder="0.00"
                  step="10"
                  min="0"
                />
              </div>
            ) : (
              <div className="presupuesto-monto">
                {presupuestos[categoria] ? formatearMoneda(presupuestos[categoria]) : '—'}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="total-presupuesto">
        <span>Presupuesto Total:</span>
        <span className="total-monto">{formatearMoneda(totalPresupuesto)}</span>
      </div>

      {editando && (
        <button 
          className="btn-cancelar"
          onClick={() => {
            cargarPresupuestos();
            setEditando(false);
          }}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
