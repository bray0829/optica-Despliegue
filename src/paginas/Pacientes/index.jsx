import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import ModalEdit from '../../Componentes/ModalEdit';
import DetailModal from '../../Componentes/DetailModal';
import supabase from '../../lib/supabaseClient';

const Pacientes = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]); // Aquí luego conectas con la base de datos
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const handleBuscar = (e) => setBusqueda(e.target.value);
  const handleFiltro = (nuevo) => setFiltro(nuevo);

  const pacientesFiltrados = pacientes.filter(() => {
    if (filtro === 'todos') return true;
    if (filtro === 'recientes') return true; // luego defines lógica real
    if (filtro === 'pendientes') return true;
    return true;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const handleEdit = (p) => { setSelected(p); setModalOpen(true); };
  const handleSaved = ({ action, item, id }) => {
    if (action === 'saved') setPacientes(prev => prev.map(x => x.id === item.id ? item : x));
    if (action === 'deleted') setPacientes(prev => prev.filter(x => x.id !== id));
  };

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const { data, error } = await supabase.from('pacientes').select('*');
        if (error) {
          console.error('Error al obtener pacientes:', error);
          return;
        }
        setPacientes(data || []);
      } catch (err) {
        console.error('Excepción al obtener pacientes:', err);
      }
    };

    fetchPacientes();
  }, []);

  return (
    <main className="pacientes">
      <header className="header">
        <h2>Gestión de Pacientes</h2>
        <p className="descripcion">
          Aquí podrás registrar, consultar y administrar tus pacientes.
        </p>
      </header>

      <div className="acciones-pacientes">
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={busqueda}
          onChange={handleBuscar}
          className="input-busqueda"
        />

        <div className="botones-filtro">
          <button
            className={`boton-filtro ${filtro === 'todos' ? 'activo' : ''}`}
            onClick={() => handleFiltro('todos')}
          >
            Todos
          </button>
          <button
            className={`boton-filtro ${filtro === 'recientes' ? 'activo' : ''}`}
            onClick={() => handleFiltro('recientes')}
          >
            Recientes
          </button>
          <button
            className={`boton-filtro ${filtro === 'pendientes' ? 'activo' : ''}`}
            onClick={() => handleFiltro('pendientes')}
          >
            Pendientes
          </button>
        </div>

        <button
          className="boton-nuevo"
          onClick={() => navigate('/nuevo-paciente')}
        >
          + Nuevo Paciente
        </button>
      </div>

      {pacientesFiltrados.length === 0 ? (
        <div className="sin-datos-card">
          <p>🧑‍⚕️ No hay pacientes registrados</p>
        </div>
      ) : (
        <div className="grid-pacientes">
          {pacientesFiltrados.map((paciente, index) => (
            <div key={index} className="card-paciente">
              <h3 className="card-title">{paciente.nombre}</h3>

              <div className="card-subtitle">
                <span className="doc">{paciente.documento || 'Sin documento'}</span>
                {paciente.telefono && <span className="dot">·</span>}
                <span className="phone">{paciente.telefono || ''}</span>
              </div>

              <div className="card-meta">
                <span className="nacimiento"><strong>Fecha de nacimiento:</strong> {paciente.fecha_nacimiento}</span>
                <span className="direccion"><strong>Dirección:</strong> {paciente.direccion}</span>
              </div>

              <div className="acciones-card">
                <button className="btn-ver" onClick={() => { setDetailItem(paciente); setDetailOpen(true); }}>Ver</button>
                <button className="btn-editar" onClick={() => handleEdit(paciente)}>Editar</button>
                <button className="btn-eliminar" onClick={() => {
                  if (!confirm('¿Eliminar paciente?')) return;
                  setPacientes(prev => prev.filter(x => x !== paciente));
                }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="paginacion">
        <button>Anterior</button>
        <span>1</span>
        <button>Siguiente</button>
      </div>
      {modalOpen && (
        <ModalEdit
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={selected}
          tableName="pacientes"
          fields={[ 'nombre', 'documento', 'telefono', 'direccion' ]}
          onSaved={handleSaved}
        />
      )}
      {detailOpen && (
        <DetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          tableName="pacientes"
          fields={[ 'nombre', 'documento', 'fechaNacimiento', 'telefono', 'direccion', 'observaciones' ]}
          onSaved={(res) => { handleSaved(res); setDetailOpen(false); }}
        />
      )}
    </main>
  );
};

export default Pacientes;
