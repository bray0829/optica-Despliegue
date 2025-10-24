import supabase from '../lib/supabaseClient';

export async function searchPacientes(query) {
  if (!query) return [];
  const q = `%${query}%`;
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('id,nombre,documento,telefono,fecha_nacimiento,usuario:usuario_id(email)')
      .or(`nombre.ilike.${q},documento.ilike.${q}`)
      .limit(10);
    if (error) {
      console.warn('[searchPacientes] error with .or() query, falling back', error.message || error);
      // fallback below
    } else {
      return data.map(p => ({
        ...p,
        correo: p.usuario?.email || null,
      })) || [];
    }

    // fallback: try name search and document search separately and merge
    const names = await supabase.from('pacientes').select('id,nombre,documento,telefono,fecha_nacimiento,usuario:usuario_id(email)').ilike('nombre', q).limit(10);
    const docs = await supabase.from('pacientes').select('id,nombre,documento,telefono,fecha_nacimiento,usuario:usuario_id(email)').ilike('documento', q).limit(10);

    const results = [];
    const seen = new Set();
    [names, docs].forEach(res => {
      if (!res || !res.data) return;
      res.data.forEach(r => {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          results.push({
            ...r,
            correo: r.usuario?.email || null,
          });
        }
      });
    });

    return results.slice(0, 10);
  } catch (err) {
    console.error('[searchPacientes] unexpected error', err);
    return [];
  }
}

export async function listPacientes() {
  const { data, error } = await supabase.from('pacientes').select('id,nombre,documento').limit(100);
  if (error) throw error;
  return data || [];
}
