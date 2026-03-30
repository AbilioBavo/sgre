'use client';

import { useEffect, useState } from 'react';

export type GeoState = {
  loading: boolean;
  error: string | null;
  coords: { lat: number; lng: number } | null;
};

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({ loading: true, error: null, coords: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: 'Geolocalização não suportada.', coords: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
        });
      },
      () => {
        setState({ loading: false, error: 'Não foi possível obter sua localização.', coords: null });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  return state;
}
