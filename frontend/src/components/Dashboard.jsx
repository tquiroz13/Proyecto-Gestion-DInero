import { useState, useEffect } from 'react';
import { PieChart, Wallet, TrendingDown, AlertCircle } from 'lucide-react';
import { presupuestosAPI, gastosAPI, COLORES_CATEGORIAS, formatearMoneda } from '../utils/api';

export default function Dashboard() {
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalGastado, setTotalGastado] = useState(0);
  const [totalPresupuesto, setTotalPresupuesto] = useState(0);

  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1;
  const añoActual = fechaActual.getFullYear();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await presupuestosAPI.obtenerResumen(mesActual, añoActual);
      setResumen(data);
      
      const totalG = data.reduce((sum, cat) => sum + cat.gastado, 0);
      const totalP = data.reduce((sum, cat) => sum + cat.presupuesto, 0);
      
      setTotalGastado(totalG);
      setTotalPresupuesto(totalP);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  const restante = totalPresupuesto - totalGastado;
  const porcentajeGastado = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto * 100) : 0;

  // Calcular ángulos para el gráfico de pastel
  const calcularAngulos = () => {
    let anguloActual = 0;
    return resumen
      .filter(cat => cat.gastado > 0)
      .map(cat => {
        const porcentaje = totalGastado > 0 ? (cat.gastado / totalGastado) * 100 : 0;
        const angulo = (porcentaje / 100) * 360;
        const inicio = anguloActual;
        anguloActual += angulo;
        
        return {
          ...cat,
          porcentaje,
          anguloInicio: inicio,
          anguloFin: anguloActual
        };
      });
  };

  const datosGrafico = calcularAngulos();

  // Crear path SVG para cada segmento
  const crearSegmento = (inicio, fin, radio = 80) => {
    const inicioRad = (inicio - 90) * Math.PI / 180;
    const finRad = (fin - 90) * Math.PI / 180;
    
    const x1 = 100 + radio * Math.cos(inicioRad);
    const y1 = 100 + radio * Math.sin(inicioRad);
    const x2 = 100 + radio * Math.cos(finRad);
    const y2 = 100 + radio * Math.sin(finRad);
    
    const largeArc = fin - inicio > 180 ? 1 : 0;
    
    return `M 100 100 L ${x1} ${y1} A ${radio} ${radio} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>
          <PieChart size={28} />
          Visión General
        </h2>
        <p className="dashboard-periodo">
          {new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="resumen-cards">
        <div className="resumen-card total-gastado">
          <div className="resumen-icon">
            <TrendingDown size={24} />
          </div>
          <div className="resumen-info">
            <span className="resumen-label">Total Gastado</span>
            <span className="resumen-valor">{formatearMoneda(totalGastado)}</span>
          </div>
        </div>

        <div className="resumen-card presupuesto-total">
          <div className="resumen-icon">
            <Wallet size={24} />
          </div>
          <div className="resumen-info">
            <span className="resumen-label">Presupuesto Total</span>
            <span className="resumen-valor">{formatearMoneda(totalPresupuesto)}</span>
          </div>
        </div>

        <div className={`resumen-card restante ${restante < 0 ? 'negativo' : ''}`}>
          <div className="resumen-icon">
            {restante < 0 ? <AlertCircle size={24} /> : <Wallet size={24} />}
          </div>
          <div className="resumen-info">
            <span className="resumen-label">
              {restante < 0 ? 'Sobrepasado' : 'Disponible'}
            </span>
            <span className="resumen-valor">{formatearMoneda(Math.abs(restante))}</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Pastel */}
      <div className="grafico-section">
        <h3>Distribución de Gastos</h3>
        
        {totalGastado > 0 ? (
          <div className="grafico-container">
            <div className="pie-chart-wrapper">
              <svg viewBox="0 0 200 200" className="pie-chart">
                {datosGrafico.map((cat, index) => (
                  <g key={cat.categoria}>
                    <path
                      d={crearSegmento(cat.anguloInicio, cat.anguloFin)}
                      fill={COLORES_CATEGORIAS[cat.categoria]}
                      className="pie-segment"
                      style={{ '--delay': `${index * 0.1}s` }}
                    />
                  </g>
                ))}
                
                {/* Círculo central */}
                <circle cx="100" cy="100" r="50" fill="#16161f" />
                
                {/* Texto central */}
                <text x="100" y="95" textAnchor="middle" className="pie-chart-total">
                  {formatearMoneda(totalGastado)}
                </text>
                <text x="100" y="110" textAnchor="middle" className="pie-chart-label">
                  Total
                </text>
              </svg>
            </div>

            {/* Leyenda */}
            <div className="chart-legend">
              {datosGrafico.map(cat => (
                <div key={cat.categoria} className="legend-item">
                  <div 
                    className="legend-color"
                    style={{ background: COLORES_CATEGORIAS[cat.categoria] }}
                  />
                  <div className="legend-info">
                    <span className="legend-categoria">{cat.categoria}</span>
                    <span className="legend-monto">
                      {formatearMoneda(cat.gastado)} ({cat.porcentaje.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-chart">
            <p>No hay gastos registrados este mes</p>
          </div>
        )}
      </div>

      {/* Detalle por Categoría */}
      <div className="detalle-categorias">
        <h3>Detalle por Categoría</h3>
        <div className="categorias-detalle-grid">
          {resumen.map(cat => {
            const porcentajeUsado = cat.presupuesto > 0 ? (cat.gastado / cat.presupuesto * 100) : 0;
            const excedido = porcentajeUsado > 100;
            
            return (
              <div 
                key={cat.categoria}
                className={`categoria-detalle-card ${excedido ? 'excedido' : ''}`}
                style={{ '--categoria-color': COLORES_CATEGORIAS[cat.categoria] }}
              >
                <div className="categoria-detalle-header">
                  <span className="categoria-detalle-nombre">{cat.categoria}</span>
                  <span className={`porcentaje-badge ${excedido ? 'excedido' : ''}`}>
                    {porcentajeUsado.toFixed(0)}%
                  </span>
                </div>
                
                <div className="categoria-detalle-montos">
                  <div className="monto-item">
                    <span>Gastado:</span>
                    <span className="monto-valor gastado">{formatearMoneda(cat.gastado)}</span>
                  </div>
                  <div className="monto-item">
                    <span>Presupuesto:</span>
                    <span className="monto-valor">{formatearMoneda(cat.presupuesto)}</span>
                  </div>
                  <div className="monto-item">
                    <span>{excedido ? 'Excedido:' : 'Restante:'}</span>
                    <span className={`monto-valor ${excedido ? 'negativo' : 'positivo'}`}>
                      {formatearMoneda(Math.abs(cat.restante))}
                    </span>
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.min(porcentajeUsado, 100)}%`,
                      background: COLORES_CATEGORIAS[cat.categoria]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
