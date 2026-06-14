'use client';

import { useEffect } from 'react';

/**
 * Service Worker を登録するクライアントコンポーネント。
 * ルートレイアウトに配置し、ブラウザがサポートしている場合のみ登録する。
 * 開発環境では SW を無効化し、古いキャッシュによる module factory エラーを防ぐ。
 */
export function SwRegister() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        if (process.env.NODE_ENV === 'development') {
            // 開発環境: 既存の SW を解除してキャッシュをクリア
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const reg of registrations) {
                    reg.unregister();
                }
            });
            if (typeof caches !== 'undefined') {
                caches.keys().then((keys) => {
                    for (const key of keys) {
                        caches.delete(key);
                    }
                });
            }
            return;
        }

        navigator.serviceWorker
            .register('/sw.js')
            .catch(() => {
                // SW 登録失敗はアプリの動作に影響しないため握りつぶす
            });
    }, []);

    return null;
}
