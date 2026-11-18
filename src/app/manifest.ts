import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'PHIIT Equipments',
        short_name: 'PHIIT',
        description: 'Portal de equipamiento técnico y mantenimiento PHIIT Equipments',
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
            {
                src: '/public/uploads/BLACK.jpeg',
                sizes: '192x192',
                type: 'image/jpeg',
            },
            {
                src: '/public/uploads/BLACK.jpeg',
                sizes: '512x512',
                type: 'image/jpeg',
            },
        ],
    }
}