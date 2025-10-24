import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../lib/supabaseClient';
import '../../../assets/nuevo-examen.css';

const NuevoRemision = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pacienteName: '',
    pacienteId: '',
    fechaNacimiento: '',
    correo: '',
    telefono: '',
    especialista: '',
    motivo: '',
  });
  const [especialistas, setEspecialistas] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Cargar especialistas
  useEffect(() => {
    const fetchEspecialistas = async () => {
      const { data, error } = await supabase
        .from('especialistas')
        .select('id, usuario:usuario_id(nombre)')
        .limit(100);

      if (error) console.error(error);
      else setEspecialistas(data.map(e => ({ id: e.id, nombre: e.usuario.nombre })));
    };

    fetchEspecialistas();
  }, []);

  // 🔹 Buscar pacientes
  const fetchPacientes = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const { data, error } = await supabase
      .from('pacientes')
      .select(`
        id, 
        nombre, 
        documento,
        fecha_nacimiento,
        telefono,
        usuario:usuario_id(
          email
        )
      `)
      .ilike('nombre', `%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error buscando pacientes:', error);
      setSuggestions([]);
    } else {
      setSuggestions(data || []);
    }
  };

  // 🔹 Cuando cambia el campo del paciente
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pacienteName') {
      setFormData(prev => ({ ...prev, [name]: value }));
      fetchPacientes(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 🔹 Seleccionar paciente
  const selectSuggestion = (s) => {
    setFormData(prev => ({
      ...prev,
      pacienteName: s.nombre,
      pacienteId: s.id,
      fechaNacimiento: s.fecha_nacimiento || '',
      correo: s.usuario?.email || '',
      telefono: s.telefono || '',
    }));
    setSuggestions([]);
  };

  // 🔹 Guardar remisión
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.pacienteId || !formData.especialista || !formData.motivo) {
      setError('Completa los campos requeridos.');
      return;
    }

    setLoading(true);
    const { error: insertError } = await supabase.from('remisiones').insert([
      {
        paciente_id: formData.pacienteId,
        especialista_id: formData.especialista,
        motivo: formData.motivo,
        fecha: new Date().toISOString().slice(0, 10),
        estado: 'pendiente',
      },
    ]);

    if (insertError) {
      console.error(insertError);
      setError('Error al guardar en la base de datos.');
    } else {
      navigate('/remisiones');
    }
    setLoading(false);
  };

  return (
    <main className="nuevo-examen-outer">
      <div className="nuevo-examen-card">
        <button type="button" className="back-button" onClick={() => navigate('/remisiones')}>←</button>
        <div className="header-container"><h2>Nueva Remisión</h2></div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Buscar Paciente</label>
            <div className="autocomplete">
              <input
                type="text"
                name="pacienteName"
                value={formData.pacienteName}
                onChange={handleInputChange}
                placeholder="Escribe el nombre del paciente"
              />
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map(s => (
                    <li key={s.id} onClick={() => selectSuggestion(s)}>
                      {s.nombre} ({s.documento})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div className="form-group">
              <label>Nombre completo</label>
              <input type="text" value={formData.pacienteName} disabled />
            </div>
            <div className="form-group">
              <label>Fecha de nacimiento</label>
              <input type="date" value={formData.fechaNacimiento} disabled />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input type="email" value={formData.correo} disabled />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="tel" value={formData.telefono} disabled />
            </div>

            <div className="form-group">
              <label>Especialista</label>
              <select name="especialista" value={formData.especialista} onChange={handleInputChange} required>
                <option value="">Selecciona un especialista</option>
                {especialistas.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Motivo de la remisión</label>
              <textarea name="motivo" value={formData.motivo} onChange={handleInputChange} rows="4" required />
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Remisión'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default NuevoRemision;
