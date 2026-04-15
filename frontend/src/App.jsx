import { useState } from 'react';
import { Receipt, PieChart, Wallet } from 'lucide-react';
import AgregarGasto from './components/AgregarGasto';
import ListaGastos from './components/ListaGastos';
import Dashboard from './components/Dashboard';
import GestionPresupuesto from './components/GestionPresupuesto';
import './App.css';

function App() {
  const [actualizarLista, setActualizarLista] = useState(0);
  const [vistaActiva, setVistaActiva] = useState('gastos'); // 'gastos', 'dashboard', 'presupuesto'

  const handleGastoCreado = () => {
    // Incrementar el contador para forzar actualización
    setActualizarLista(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Mis Finanzas</h1>
        <p>Controla tus gastos con estilo</p>
      </header>

      {/* Navegación por pestañas */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${vistaActiva === 'gastos' ? 'active' : ''}`}
          onClick={() => setVistaActiva('gastos')}
        >
          <Receipt size={20} />
          <span>Gastos</span>
        </button>
        <button 
          className={`nav-tab ${vistaActiva === 'dashboard' ? 'active' : ''}`}
          onClick={() => setVistaActiva('dashboard')}
        >
          <PieChart size={20} />
          <span>Visión</span>
        </button>
        <button 
          className={`nav-tab ${vistaActiva === 'presupuesto' ? 'active' : ''}`}
          onClick={() => setVistaActiva('presupuesto')}
        >
          <Wallet size={20} />
          <span>Presupuesto</span>
        </button>
      </nav>

      <main>
        {vistaActiva === 'gastos' && (
          <>
            <AgregarGasto onGastoCreado={handleGastoCreado} />
            <ListaGastos actualizarLista={actualizarLista} />
          </>
        )}
        
        {vistaActiva === 'dashboard' && (
          <Dashboard key={actualizarLista} />
        )}
        
        {vistaActiva === 'presupuesto' && (
          <GestionPresupuesto />
        )}
      </main>
    </div>
  );
}

export default App;
