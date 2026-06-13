const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function fetchCrewAlerts(threshold: number = 0) {
  const res = await fetch(`${API_BASE_URL}/crew/roster/alerts?threshold=${threshold}`);
  if (!res.ok) throw new Error('Failed to fetch crew alerts');
  return res.json();
}

export async function requestCrewSwap(pilotId: string) {
  const res = await fetch(`${API_BASE_URL}/crew/roster/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fatigued_pilot_id: pilotId, time_window_minutes: 45 }),
  });
  if (!res.ok) throw new Error('Failed to request swap');
  return res.json();
}

export async function fetchCongestion(terminal?: string) {
  const url = terminal ? `${API_BASE_URL}/fois/congestion/${terminal}` : `${API_BASE_URL}/fois/congestion`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch congestion for ${terminal || 'all terminals'}`);
  return res.json();
}

export async function fetchAllRakes() {
  const res = await fetch(`${API_BASE_URL}/fois/rakes`);
  if (!res.ok) throw new Error('Failed to fetch rakes');
  return res.json();
}

export async function fetchBatchEtas(rakeIds: string[]) {
  const res = await fetch(`${API_BASE_URL}/fois/eta/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rake_ids: rakeIds, origin: "Mundra", destination: "New Delhi" }),
  });
  if (!res.ok) throw new Error('Failed to fetch batch ETAs');
  return res.json();
}

export async function fetchStations() {
  const res = await fetch(`${API_BASE_URL}/concierge/stations`);
  if (!res.ok) throw new Error('Failed to fetch stations');
  return res.json();
}

export async function fetchLanguages() {
  const res = await fetch(`${API_BASE_URL}/concierge/languages`);
  if (!res.ok) throw new Error('Failed to fetch languages');
  return res.json();
}

export async function generateItinerary(pnr: string, stationCode: string, lang: string, hours: number) {
  const res = await fetch(`${API_BASE_URL}/concierge/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pnr: pnr, station: stationCode, layover_minutes: hours * 60, language: lang }),
  });
  if (!res.ok) throw new Error('Failed to generate itinerary');
  return res.json();
}
