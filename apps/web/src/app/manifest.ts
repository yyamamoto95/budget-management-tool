import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '家計管理',
        short_name: '家計管理',
        description: '日々の支出・収入を記録し、生活余力を把握するツール',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fef5ee',
        theme_color: '#f18840',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
        ],
        categories: ['finance', 'lifestyle'],
        lang: 'ja',
        dir: 'ltr',
    };
}
