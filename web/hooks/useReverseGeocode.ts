'use client';

import { useEffect, useMemo, useState } from 'react';

type Coords = { lat: number; lng: number } | null;

type ReverseState = {
  loading: boolean;
  error: string | null;
  fullAddress: string | null;
};

type NominatimResponse = {
  address?: {
    road?: string;
    residential?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

export function useReverseGeocode(coords: Coords): ReverseState {
  const [state, setState] = useState<ReverseState>({ loading: false, error: null, fullAddress: null });

  useEffect(() => {
    if (!coords) return;

    const controller = new AbortController();
    setState({ loading: true, error: null, fullAddress: null });

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao converter coordenadas em endereço.');
        return response.json() as Promise<NominatimResponse>;
      })
      .then((payload) => {
        const address = payload.address;
        if (!address) throw new Error('Endereço indisponível para esta localização.');

        const road = address.road ?? address.residential;
        const bairro = address.suburb ?? address.neighbourhood ?? address.city_district;
        const city = address.city ?? address.town ?? address.village;
        const parts = [road, bairro ? `Bairro ${bairro}` : undefined, city, address.state, address.country].filter(Boolean);

        setState({
          loading: false,
          error: null,
          fullAddress: parts.length > 0 ? parts.join(', ') : 'Endereço não identificado.',
        });
      })
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        setState({ loading: false, error: error.message, fullAddress: null });
      });

    return () => controller.abort();
  }, [coords]);

  return useMemo(() => state, [state]);
}
