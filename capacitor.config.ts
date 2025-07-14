import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.aa3955e8940a446da719a9a94aa99306',
  appName: 'smartwork-hub-onboard',
  webDir: 'dist',
  server: {
    url: 'https://aa3955e8-940a-446d-a719-a9a94aa99306.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      permissions: {
        camera: 'Camera access is required for document scanning',
        photos: 'Photo library access is required'
      }
    },
    Geolocation: {
      permissions: {
        location: 'Location access is required for site tracking'
      }
    }
  }
};

export default config;