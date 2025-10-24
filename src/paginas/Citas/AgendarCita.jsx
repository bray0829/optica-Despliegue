import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabaseClient";
import { searchPacientes } from "../../services/pacientes";
import { useAuth } from '../../context/AuthContextDefinition';
import usuariosService from '../../services/usuarios';

const AgendarCita = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    pacienteName: "",
    pacienteId: "",
    documento: "",
    telefono: "",
    fecha: "",
    hora: "",
    especialista: "",
    motivo: "",
  });

  const [especialistas, setEspecialistas] = useState([]);
  const [availableHours, setAvailableHours] = useState([]);
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef(null);

  const allHours = useMemo(
    () => ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    []
  );

  // 🔹 Cargar especialistas y citas
  useEffect(() => {
    // Si el usuario es especialista, no puede agendar citas
    let mounted = true;
    (async () => {
      try {
        if (user?.id) {
          const perfil = await usuariosService.getUsuarioById(user.id);
          if (!mounted) return;
          if (perfil?.rol === 'especialista') {
            alert('No tienes permiso para agendar citas.');
            navigate('/citas-registradas');
            return;
          }
        }
      } catch (err) {
        console.error('Error comprobando permisos en AgendarCita', err);
      }
    })();

    const fetchData = async () => {
      try {
        const { data: espData, error: espError } = await supabase
          .from("especialistas")
          .select("id, usuario_id, especialidad, usuarios (id, nombre)");

        if (espError) throw espError;

        const mapped =
          espData?.map((e) => ({
            id: e.id,
            usuario_id: e.usuario_id,
            nombre: e.usuarios?.nombre || "Sin nombre",
            especialidad: e.especialidad,
          })) || [];

        setEspecialistas(mapped);

        const { data: citasData, error: citasError } = await supabase
          .from("citas")
          .select("*");
        if (citasError) throw citasError;

        setCitas(citasData || []);
      } catch (err) {
        console.error("Error al cargar especialistas o citas:", err);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [user?.id, navigate]);


  // 🔹 Calcular horas disponibles
  useEffect(() => {
    if (!form.fecha || !form.especialista) {
      setAvailableHours([]);
      return;
    }

    const ocupadas = citas
      .filter(
        (c) =>
          c.fecha === form.fecha &&
          String(c.especialista_id) === String(form.especialista)
      )
      .map((c) => c.hora);

    setAvailableHours(allHours.filter((h) => !ocupadas.includes(h)));
  }, [form.fecha, form.especialista, citas, allHours]);

  // 🔹 Buscar pacientes (debounce)
  useEffect(() => {
    const q = form.pacienteName?.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPacientes(q);
        setSuggestions(results || []);
      } catch (err) {
        console.error("Error buscando pacientes", err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [form.pacienteName]);

  // ✅ Selección segura de paciente
  const selectSuggestion = (p) => {
    setForm((prev) => ({
      ...prev,
      pacienteName: p.nombre || "",
      pacienteId: p.id || "",
      documento: p.documento || "",
      telefono: p.telefono || "",
    }));
    setSuggestions([]);
    setError("");
  };

  // 🔹 Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.pacienteId) {
      setError("Debes seleccionar un paciente de la lista desplegable.");
      return;
    }

    if (!form.fecha || !form.hora || !form.especialista) {
      setError("Completa los campos requeridos (fecha, hora, especialista).");
      return;
    }

    try {
      const especialistaId = form.especialista;
      const pacienteId = form.pacienteId;

      console.log("Valor de especialistaId:", especialistaId); // Registro adicional para depuración

      if (!especialistaId || !pacienteId) {
        setError("Error interno: ID de especialista o paciente inválido.");
        return;
      }

      const payload = {
        paciente_id: pacienteId,
        especialista_id: especialistaId,
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo || null,
        estado: "agendada",
      };

      console.log("Payload enviado:", payload); // Registro para depuración

      const { data, error: supError } = await supabase.from("citas").insert([payload]).select();

      if (supError) throw supError;

      console.log("Respuesta de inserción:", data); // Registro para verificar la respuesta

      navigate("/citas-registradas");
    } catch (err) {
      console.error("Error al guardar cita:", err);
      setError("Error inesperado al guardar la cita.");
    }
  };

  return (
    <main className="nuevo-examen-outer">
      <div className="nuevo-examen-card">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/citas-registradas")}
        >
          ←
        </button>

        <div className="header-container">
          <h2>Agendar Nueva Cita</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {/* 🔹 Autocomplete corregido */}
          <div className="form-group autocomplete" style={{ position: "relative" }}>
            <label>Buscar Paciente</label>
            <input
              type="text"
              value={form.pacienteName}
              onChange={(e) => {
                const value = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  pacienteName: value,
                  pacienteId: "",
                  documento: "",
                  telefono: "",
                }));
                setError("");
              }}
              placeholder="Busca por nombre o documento"
              autoComplete="off"
              onBlur={() => {
                setTimeout(() => setSuggestions([]), 200);
              }}
            />
            {suggestionsLoading && (
              <div className="suggestions-loading">Buscando...</div>
            )}
            {suggestions.length > 0 && (
              <ul
                className="suggestions-list"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "1px solid #ddd",
                  zIndex: 999,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onMouseDown={() => selectSuggestion(s)}
                    style={{
                      padding: "8px 10px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{s.nombre}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {s.documento} {s.telefono ? `· ${s.telefono}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 🔹 Datos del paciente */}
          <div className="details-grid">
            <div className="form-group">
              <label>Documento</label>
              <input
                type="text"
                value={form.documento}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, documento: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, telefono: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label>Especialista</label>
              <select
                value={form.especialista}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, especialista: e.target.value }))
                }
              >
                <option value="">Selecciona</option>
                {especialistas.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.nombre} - {sp.especialidad}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label>Hora</label>
              <select
                value={form.hora}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, hora: e.target.value }))
                }
              >
                <option value="">Selecciona</option>
                {availableHours.length > 0 ? (
                  availableHours.map((h) => <option key={h}>{h}</option>)
                ) : (
                  <option disabled>No hay horas disponibles</option>
                )}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Motivo</label>
              <textarea
                value={form.motivo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, motivo: e.target.value }))
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!form.pacienteId || !form.fecha || !form.hora || !form.especialista}
          >
            Agendar Cita
          </button>
        </form>
      </div>
    </main>
  );
};

export default AgendarCita;
