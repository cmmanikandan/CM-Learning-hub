// Central API base URL configuration
// Production: https://cm-learning-hub.onrender.com (Render backend)
// Local dev:  http://127.0.0.1:5000

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // If running in browser and on a local/LAN network
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local')
    ) {
      return `http://${hostname}:5000`;
    }
  }

  return 'https://cm-learning-hub.onrender.com';
};

export const API_BASE = getApiBase();
