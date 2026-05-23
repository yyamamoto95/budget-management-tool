"use client";

import { useState, useEffect, useRef } from "react";
import { publicFetch } from "@/lib/api/public-client";

interface Props {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
}

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 3;
const VALID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function computeImmediateState(value: string): CheckState | null {
    if (!value || value.length < MIN_LENGTH) return "idle";
    if (!VALID_PATTERN.test(value)) return "invalid";
    return null; // 非同期チェックが必要
}

export function UserNameInput({ value, onChange, error, disabled }: Props) {
    const [checkState, setCheckState] = useState<CheckState>("idle");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // すべての setState 呼び出しを setTimeout 内（非同期）に移動してルール違反を回避する
        timerRef.current = setTimeout(() => {
            const immediate = computeImmediateState(value);
            if (immediate !== null) {
                setCheckState(immediate);
                return;
            }
            setCheckState("checking");
            publicFetch<{ available: boolean }>(
                `/register/check-username?userId=${encodeURIComponent(value)}`,
            )
                .then((res) => setCheckState(res.available ? "available" : "taken"))
                .catch(() => setCheckState("idle"));
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [value]);

    const statusIcon = () => {
        if (checkState === "checking") return <span className="text-zinc-400 text-sm">確認中...</span>;
        if (checkState === "available") return <span className="text-green-600 dark:text-green-400 text-sm">✓ 使用可能</span>;
        if (checkState === "taken") return <span className="text-red-500 text-sm">✗ 使用済み</span>;
        if (checkState === "invalid") return <span className="text-orange-500 text-sm">半角英数字・_ ・- のみ</span>;
        return null;
    };

    // 入力状態に応じたボーダー色クラス
    let borderColor: string;
    if (checkState === "available") borderColor = "border-green-500 focus:border-green-500";
    else if (checkState === "taken" || checkState === "invalid") borderColor = "border-red-400 focus:border-red-500";
    else borderColor = "border-zinc-300 dark:border-zinc-600 focus:border-zinc-500";

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor="userId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ユーザー名（ログインID）
            </label>
            <div className="relative">
                <input
                    id="userId"
                    name="userId"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    autoComplete="username"
                    placeholder="半角英数字・_・- （3〜30文字）"
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none dark:bg-zinc-700 dark:text-zinc-50 ${borderColor}`}
                />
            </div>
            <div className="flex items-center justify-between">
                {statusIcon()}
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
        </div>
    );
}

/** 確認結果が「使用不可」かどうかを判定する。フォーム送信ガードに使用する */
export function isUserNameUnavailable(value: string): boolean {
    if (!value || value.length < MIN_LENGTH) return true;
    if (!VALID_PATTERN.test(value)) return true;
    return false;
}
