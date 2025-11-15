import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StarShield Affiliate Portal',
    short_name: 'StarShield',
    description: 'Mobile-first portal for StarShield affiliates.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#0f172a',
    lang: 'en',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
}
