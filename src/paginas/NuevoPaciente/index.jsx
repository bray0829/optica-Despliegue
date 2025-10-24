import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import supabase from '../../lib/supabaseClient';

const NuevoPaciente = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
    observaciones: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const buscarUsuario = async () => {
    setError(null);

    try {
      const { data: usuario, error: fetchError } = await supabase
        .from('usuarios')
        .select('id, nombre, email, telefono')
        .or(`nombre.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error al buscar usuario:', fetchError);
        setError('Error al buscar usuario. Intenta nuevamente.');
        return;
      }

      if (!usuario) {
        setError('No se encontró ningún usuario con ese nombre o correo.');
        return;
      }

      // Autocompletar campos del formulario
      setFormData(prev => ({
        ...prev,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
      }));

      return usuario.id; // Retornar el usuario_id
    } catch (err) {
      console.error('Excepción al buscar usuario:', err);
      setError('Error inesperado al buscar usuario.');
    }
  };

  const guardarPaciente = async (usuarioId) => {
    try {
      const { error: insertError } = await supabase.from('pacientes').insert([
        {
          usuario_id: usuarioId,
          nombre: formData.nombre,
          telefono: formData.telefono,
          documento: formData.documento,
          fecha_nacimiento: formData.fechaNacimiento,
          direccion: formData.direccion,
          observaciones: formData.observaciones,
        },
      ]);

      if (insertError) {
        console.error('Error al guardar paciente:', insertError);
        setError('Error al guardar el paciente. Intenta nuevamente.');
        return;
      }

      alert('Paciente guardado correctamente');
      navigate('/pacientes');
    } catch (err) {
      console.error('Excepción al guardar paciente:', err);
      setError('Error inesperado al guardar paciente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const usuarioId = await buscarUsuario();

    if (!usuarioId) {
      return; // Detener si no se encontró el usuario
    }

    await guardarPaciente(usuarioId);
  };

  return (
    <main className="nuevo-paciente-container">
      {/* Cabecera con botón volver */}
      <div className="header-container">
        <h2>Nuevo Paciente</h2>
        <button 
          type="button" 
          className="back-button"
          onClick={() => navigate('/pacientes')}
        >
          ←
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="paciente-form">
        {error && <div className="form-error">{error}</div>}

        {/* Campo de búsqueda */}
        <div className="form-group">
          <label htmlFor="search">Buscar usuario (nombre o correo)</label>
          <input
            type="text"
            id="search"
            name="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Escribe el nombre o correo del usuario"
          />
          <button type="button" onClick={buscarUsuario} className="search-button">
            Buscar
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="documento">Documento / ID</label>
            <input
              type="text"
              id="documento"
              name="documento"
              value={formData.documento}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              disabled
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="4"
              placeholder="Agrega cualquier nota relevante sobre el paciente"
            />
          </div>
        </div>

        <button type="submit" className="submit-button">
          Guardar Paciente
        </button>
      </form>
    </main>
  );
};

export default NuevoPaciente;
