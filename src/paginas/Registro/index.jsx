import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../Login/style.css";
import supabase from '../../lib/supabaseClient';

function Registro() {
	const [nombre, setNombre] = useState("");
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [telefono, setTelefono] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const validarEmail = (e) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
		return re.test(String(e).toLowerCase());
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		// Validaciones de campos
		if (!nombre || !email || !telefono || !password || !confirm) {
			setError('Por favor completa todos los campos obligatorios.');
			setLoading(false);
			return;
		}
		if (!validarEmail(email)) {
			setError('Formato de correo inválido.');
			setLoading(false);
			return;
		}
		if (password !== confirm) {
			setError('Las contraseñas no coinciden.');
			setLoading(false);
			return;
		}

		try {
			if (!supabase) {
				console.warn('Supabase no configurado.');
				setLoading(false);
				return;
			}

			const { data: authData, error: supError } = await supabase.auth.signUp({ email, password });

			if (supError) {
				console.error('Supabase signup error', supError);
				setError(supError.message.includes('already registered') 
								? 'El correo ya está registrado.' 
								: 'Error al registrar: ' + supError.message);
				setLoading(false);
				return;
			}

			const userID = authData.user?.id;

			// Si el signup requiere confirmación por correo, userID puede ser undefined.
			// Guardamos sólo el perfil cuando exista userID.

			if (userID) {
				const { error: insertError } = await supabase.from('usuarios').insert([
					{
						id: userID,
						nombre,
						email,
						telefono,
						rol: 'paciente',
					}
				]);

				if (insertError) {
					console.error('Error al guardar perfil:', insertError);
					// Mostrar mensaje más descriptivo si Supabase lo proporciona
					const msg = insertError?.message || JSON.stringify(insertError);
					setError('Registro de cuenta exitoso, pero falló la creación del perfil. ' + msg);
					setLoading(false);
					return;
				}

						alert('¡Registro completado y perfil guardado!');
						navigate('/login');
			} else {
						alert('¡Registro exitoso! Revisa tu correo electrónico para confirmar tu cuenta y poder iniciar sesión.');
						navigate('/login');
			}
		} catch (err) {
			console.error('Error general:', err);
			setError('Error general al registrar.');
		} finally {
			setLoading(false);
		}
	};
    
	return (
		<div className="login-page">
			<div className="login-card">
				<div className="login-avatar" aria-hidden>👤</div>
				<h2>Crear cuenta</h2>
				<p>Regístrate para acceder al panel clínico</p>

				<form onSubmit={handleSubmit}>
					{error && <div className="form-error">{error}</div>}
					<input className="form-input" type="text" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
					<input className="form-input" type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
					<input className="form-input" type="text" placeholder="Número de teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
					<input className="form-input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
					<input className="form-input" type="password" placeholder="Confirmar contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

					<button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrarse'}</button>
				</form>

				<div className="links">¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></div>
			</div>
		</div>
	);
}

export default Registro;