import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./style.css";
import supabase from '../../lib/supabaseClient';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const validarEmail = (e) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(String(e).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validaciones
    if (!email || !password) {
      setError("Por favor completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }
    if (!validarEmail(email)) {
      setError("Formato de correo inválido.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        console.error("Error de inicio de sesión:", loginError);
        setError("Credenciales incorrectas. Por favor verifica tu correo y contraseña.");
        setLoading(false);
        return;
      }

      // Si la respuesta incluye una sesión, navegamos de inmediato.
      if (data?.session) {
        alert("\u00A1Inicio de sesi\u00F3n exitoso!");
        navigate('/');
        return;
      }

      // Si no hay sesión inmediata, hacemos un breve poll a getSession (hasta 5s)
      let session = null;
      const start = Date.now();
      while (!session && Date.now() - start < 5000) {
        // espera 300ms entre intentos
        await new Promise(r => setTimeout(r, 300));
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session ?? null;
      }

      if (session) {
        alert("\u00A1Inicio de sesi\u00F3n exitoso!");
        navigate('/');
        return;
      }

      // Si sigue sin haber sesión, informar al usuario
      alert('Inicio de sesión parcialmente exitoso. Revisa tu correo para confirmar la cuenta si es necesario.');
      navigate('/login');
    } catch (err) {
      console.error("Error general:", err);
      setError("Error general al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-avatar" aria-hidden="true">👤</div>
        <h2>Iniciar sesión</h2>
        <p>Accede al panel clínico</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <input
            className="form-input"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="form-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>{loading ? "Iniciando..." : "Iniciar sesión"}</button>
        </form>

        <div style={{ marginTop: 12 }}>
          <div className="links">
            ¿No tienes cuenta? <a href="/registro">Regístrate</a>
            <div style={{ marginTop: 8 }}>
              <a href="/reset-password">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
