import supabase from '../lib/supabaseClient';

const getEspecialistaByUsuarioId = async (usuarioId) => {
  if (!usuarioId) return null;
  const { data, error } = await supabase
    .from('especialistas')
    .select('id, usuario_id, especialidad')
    .eq('usuario_id', usuarioId)
    .single();
  if (error) {
    console.error('getEspecialistaByUsuarioId error', error);
    return null;
  }
  return data; // may be null if not found
};

export default {
  getEspecialistaByUsuarioId,
};
