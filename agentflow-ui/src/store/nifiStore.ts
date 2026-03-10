import { create } from 'zustand';

type NifiState = {
  baseUrl: string;
  isConnected: boolean;
  connectionError: string | null;
};

type NifiActions = {
  setBaseUrl: (url: string) => void;
  setConnected: (connected: boolean, error?: string) => void;
};

const defaultBaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NIFI_API_URL as string | undefined) || '/nifi-api';

export const useNifiStore = create<NifiState & NifiActions>((set) => ({
  baseUrl: defaultBaseUrl,
  isConnected: false,
  connectionError: null,

  setBaseUrl: (url: string) => {
    set({ baseUrl: url });
  },

  setConnected: (connected: boolean, error?: string) => {
    set({ isConnected: connected, connectionError: error ?? null });
  },
}));
