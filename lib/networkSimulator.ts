import { useStore } from '../store';

// Helper for testing offline functionality
export const NetworkSimulator = {
  goOffline: async () => {
    console.log('🔴 Simulating offline mode');
    await useStore.getState().setOnline(false);
  },

  goOnline: async () => {
    console.log('🟢 Simulating online mode - this will trigger automatic sync');
    await useStore.getState().setOnline(true);
  },

  toggle: async () => {
    const { isOnline, setOnline } = useStore.getState();
    console.log(isOnline ? '🔴 Going offline' : '🟢 Going online - this will trigger automatic sync');
    await setOnline(!isOnline);
  }
};

// Add to global for easy testing in development
if (__DEV__) {
  (global as any).NetworkSimulator = NetworkSimulator;
}