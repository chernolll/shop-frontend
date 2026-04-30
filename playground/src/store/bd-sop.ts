import type { BDSopApi } from '#/api/bd/sop';

import { ref } from 'vue';

import { defineStore } from 'pinia';

const BD_CURRENT_SOP_STORAGE_KEY = 'bd-current-sop';

function readStoredSop() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(BD_CURRENT_SOP_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as BDSopApi.Item;
  } catch {
    window.sessionStorage.removeItem(BD_CURRENT_SOP_STORAGE_KEY);
    return null;
  }
}

export const useBDSopStore = defineStore('bd-sop', () => {
  const currentSop = ref<BDSopApi.Item | null>(readStoredSop());

  function setCurrentSop(sop: BDSopApi.Item) {
    currentSop.value = sop;

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        BD_CURRENT_SOP_STORAGE_KEY,
        JSON.stringify(sop),
      );
    }
  }

  function getCurrentSopById(sopId: number | string) {
    if (currentSop.value && String(currentSop.value.id) === String(sopId)) {
      return currentSop.value;
    }

    const storedSop = readStoredSop();
    if (storedSop && String(storedSop.id) === String(sopId)) {
      currentSop.value = storedSop;
      return storedSop;
    }

    return null;
  }

  function clearCurrentSop() {
    currentSop.value = null;

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(BD_CURRENT_SOP_STORAGE_KEY);
    }
  }

  return {
    clearCurrentSop,
    currentSop,
    getCurrentSopById,
    setCurrentSop,
  };
});
