import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.busaisp.app',
  appName: 'Busaí SP',
  webDir: 'public',
  server: {
    url: 'https://busaisp.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0B0A14'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0A14'
    }
  }
};

export default config;
