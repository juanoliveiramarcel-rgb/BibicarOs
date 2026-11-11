import { MechanicProfile } from '../types';

import { safeSetItem } from './safeStorage';

export type { MechanicProfile };

const STORAGE_KEY = 'bibicar_mechanics';
export const MECHANICS_UPDATED_EVENT = 'bibicar_mechanics_changed';

export const DEFAULT_MECHANICS: MechanicProfile[] = [
  {
    id: 'mec-1',
    nome: 'Beto',
    comissaoTaxa: 30,
    telefone: '(11) 98765-4321',
    especialidade: 'Mecânica Geral, Freios & Suspensão',
    chavePix: 'beto.mecanico@bibicar.com.br',
    ativo: true,
    dataCadastro: '2024-01-10',
  },
  {
    id: 'mec-2',
    nome: 'Marcos',
    comissaoTaxa: 30,
    telefone: '(11) 97654-3210',
    especialidade: 'Injeção Eletrônica, Motor & Câmbio',
    chavePix: '11976543210',
    ativo: true,
    dataCadastro: '2024-01-15',
  },
];

export function getStoredMechanics(): MechanicProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      safeSetItem(STORAGE_KEY, JSON.stringify(DEFAULT_MECHANICS));
      return DEFAULT_MECHANICS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    safeSetItem(STORAGE_KEY, JSON.stringify(DEFAULT_MECHANICS));
    return DEFAULT_MECHANICS;
  } catch (err) {
    console.warn('Erro ao ler mecânicos do localStorage:', err);
    return DEFAULT_MECHANICS;
  }
}

export function saveStoredMechanics(mechanics: MechanicProfile[]): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(mechanics));
  window.dispatchEvent(new CustomEvent(MECHANICS_UPDATED_EVENT, { detail: mechanics }));
}

export function addStoredMechanic(
  data: Omit<MechanicProfile, 'id' | 'dataCadastro'>
): MechanicProfile {
  const current = getStoredMechanics();
  const newMechanic: MechanicProfile = {
    ...data,
    id: `mec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    dataCadastro: new Date().toISOString().split('T')[0],
  };

  const updated = [...current, newMechanic];
  saveStoredMechanics(updated);
  return newMechanic;
}

export function updateStoredMechanic(
  id: string,
  updates: Partial<Omit<MechanicProfile, 'id'>>
): MechanicProfile[] {
  const current = getStoredMechanics();
  const updated = current.map((m) => (m.id === id ? { ...m, ...updates } : m));
  saveStoredMechanics(updated);
  return updated;
}

export function deleteStoredMechanic(id: string): MechanicProfile[] {
  const current = getStoredMechanics();
  const updated = current.filter((m) => m.id !== id);
  saveStoredMechanics(updated);
  return updated;
}
