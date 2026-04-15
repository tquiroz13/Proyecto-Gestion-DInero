import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { gastosAPI, CATEGORIAS, COLORES_CATEGORIAS } from '../utils/api';

export default function AgregarGasto({ onGastoCreado }) {
  const [formData, setFormData] = useState({
    monto: '',
    categoria: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const gasto = {
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
        descripcion: formData.descripcion || null,
        fecha: new Date(formData.fecha).toISOString(),
      };

      await gastosAPI.crear(gasto);
      
      // Resetear formulario
      setFormData({
        monto: '',
        categoria: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
      });
      
      setMostrarFormulario(false);
      
      // Notificar al padre que se creó un gasto
      if (onGastoCreado) {
        onGastoCreado();
      }
    } catch (err) {
      setError(err.message || 'Error al crear el gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="agregar-gasto-container">
      {!mostrarFormulario ? (
        <button 
          className="btn-abrir-formulario"
          onClick={() => setMostrarFormulario(true)}
        >
          <Plus size={24} />
          <span>Registrar Gasto</span>
          <Sparkles size={20} className="sparkle" />
        </button>
      ) : (
        <div className="formulario-gasto">
          <div className="formulario-header">
            <h2>Nuevo Gasto</h2>
            <button 
              className="btn-cerrar"
              onClick={() => setMostrarFormulario(false)}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group monto-group">
                <label htmlFor="monto">Monto</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">€</span>
                  <input
                    type="number"
                    id="monto"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="fecha">Fecha</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <div className="categorias-grid">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`categoria-btn ${formData.categoria === cat ? 'selected' : ''}`}
                    style={{
                      '--categoria-color': COLORES_CATEGORIAS[cat],
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, categoria: cat }))}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción (opcional)</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="¿En qué gastaste?"
                rows="3"
                maxLength="200"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading || !formData.categoria}
            >
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
