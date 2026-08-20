import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';

/**
 * Hook reutilizable para consumir la API con estados de carga y error.
 * Ejecuta un GET a `url` al montar (y cuando cambian sus dependencias).
 *
 * @param {string} url  Ruta relativa a la API (ej. '/auth/me').
 * @param {any[]}  deps Dependencias que disparan una recarga.
 * @returns {{ data, loading, error, reload }}
 */
export default function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar los datos.'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
