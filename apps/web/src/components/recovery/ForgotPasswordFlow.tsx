"use client";

import { useActionState, useState } from "react";
import {
    lookupRecoveryAction,
    verifyRecoveryAction,
    resetPasswordAction,
} from "@/lib/actions/recovery";
import type { LookupState, VerifyState, ResetPasswordState } from "@/lib/actions/recovery";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";
import Link from "next/link";

type Step = "lookup" | "verify" | "reset";

// ─── ステップ1: ユーザー名入力 ─────────────────────────────────────

function LookupStep({ onNext }: { onNext: (userId: string, questionText: string) => void }) {
    const [state, formAction, isPending] = useActionState<LookupState, FormData>(
        async (prev, formData) => {
            const result = await lookupRecoveryAction(prev, formData);
            if (result.question && result.userId) {
                onNext(result.userId, result.question.questionText);
            }
            return result;
        },
        { error: null },
    );

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-medium text-[#1c1410]/60">
                登録時に設定したユーザー名を入力してください。秘密の質問でパスワードを再設定できます。
            </p>
            <div className="flex flex-col gap-1">
                <label htmlFor="userId" className="text-sm font-bold text-[#1c1410]">
                    ユーザー名
                </label>
                <input
                    id="userId"
                    name="userId"
                    type="text"
                    autoComplete="username"
                    placeholder="ユーザー名を入力"
                    className="input-pop"
                />
            </div>
            {state.error && (
                <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
                    {state.error}
                </p>
            )}
            <button type="submit" disabled={isPending} className="btn-candy w-full disabled:opacity-50">
                {isPending ? "確認中..." : "次へ"}
            </button>
        </form>
    );
}

// ─── ステップ2: 秘密の質問回答 ─────────────────────────────────────

function VerifyStep({
    userId,
    questionText,
    onNext,
}: {
    userId: string;
    questionText: string;
    onNext: (resetToken: string) => void;
}) {
    const [state, formAction, isPending] = useActionState<VerifyState, FormData>(
        async (prev, formData) => {
            const result = await verifyRecoveryAction(prev, formData);
            if (result.resetToken) {
                onNext(result.resetToken);
            }
            return result;
        },
        { error: null },
    );

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="userId" value={userId} />

            <div className="rounded-xl border border-[rgba(28,20,16,0.08)] bg-[#fffdf5] px-4 py-3">
                <p className="text-xs font-bold text-[#1c1410]/40 mb-1">秘密の質問</p>
                <p className="text-sm font-bold text-[#1c1410]">{questionText}</p>
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="answer" className="text-sm font-bold text-[#1c1410]">
                    回答
                </label>
                <input
                    id="answer"
                    name="answer"
                    type="text"
                    autoComplete="off"
                    placeholder="回答を入力（大文字・小文字は区別されません）"
                    className="input-pop"
                />
            </div>

            {state.error && (
                <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
                    {state.error}
                </p>
            )}

            <button type="submit" disabled={isPending} className="btn-candy w-full disabled:opacity-50">
                {isPending ? "照合中..." : "回答を確認する"}
            </button>
        </form>
    );
}

// ─── ステップ3: 新パスワード設定 ──────────────────────────────────

function ResetStep({ resetToken }: { resetToken: string }) {
    const [newPassword, setNewPassword] = useState("");
    const [state, formAction, isPending] = useActionState<ResetPasswordState, FormData>(
        resetPasswordAction,
        { error: null },
    );

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="resetToken" value={resetToken} />

            <p className="text-sm font-medium text-[#1c1410]/60">
                新しいパスワードを設定してください。
            </p>

            <div className="flex flex-col gap-1">
                <label htmlFor="newPassword" className="text-sm font-bold text-[#1c1410]">
                    新しいパスワード
                </label>
                <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="8文字以上"
                    className="input-pop"
                />
                <PasswordStrengthMeter password={newPassword} />
            </div>

            {state.error && (
                <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
                    {state.error}
                </p>
            )}

            <button type="submit" disabled={isPending} className="btn-candy w-full disabled:opacity-50">
                {isPending ? "設定中..." : "パスワードを設定する"}
            </button>
        </form>
    );
}

// ─── メインコンポーネント ─────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
    lookup: "STEP 1 — ユーザー名を入力",
    verify: "STEP 2 — 秘密の質問に回答",
    reset: "STEP 3 — 新しいパスワードを設定",
};

const STEPS: Step[] = ["lookup", "verify", "reset"];

export function ForgotPasswordFlow() {
    const [step, setStep] = useState<Step>("lookup");
    const [userId, setUserId] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [resetToken, setResetToken] = useState("");

    const currentIdx = STEPS.indexOf(step);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-4">
            <section
                className="w-full max-w-sm rounded-2xl border border-[rgba(28,20,16,0.08)] bg-white p-8"
                style={{ boxShadow: "var(--shadow-card)" }}
            >
                <div className="mb-2 flex items-center gap-3">
                    <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(28,20,16,0.08)] bg-[#f18840] text-xs font-extrabold text-white"
                        style={{ boxShadow: "0 1px 4px rgba(28,20,16,0.08)" }}
                    >
                        B
                    </span>
                    <h1 className="text-lg font-extrabold text-[#1c1410]">
                        パスワードを忘れた場合
                    </h1>
                </div>
                <p className="mb-5 text-xs font-bold text-[#1c1410]/40 uppercase tracking-wider">
                    {STEP_LABELS[step]}
                </p>

                {/* ステップインジケーター */}
                <div className="flex gap-2 mb-6">
                    {STEPS.map((s, i) => (
                        <div
                            key={s}
                            className="h-2 flex-1 rounded-full border border-[#1c1410]/10"
                            style={{
                                backgroundColor: i <= currentIdx ? "#f18840" : "#e8c8b0",
                            }}
                        />
                    ))}
                </div>

                {step === "lookup" && (
                    <LookupStep
                        onNext={(uid, qText) => {
                            setUserId(uid);
                            setQuestionText(qText);
                            setStep("verify");
                        }}
                    />
                )}
                {step === "verify" && (
                    <VerifyStep
                        userId={userId}
                        questionText={questionText}
                        onNext={(token) => {
                            setResetToken(token);
                            setStep("reset");
                        }}
                    />
                )}
                {step === "reset" && <ResetStep resetToken={resetToken} />}

                <div className="mt-6 border-t border-[rgba(28,20,16,0.08)] pt-4 text-center">
                    <Link
                        href="/login"
                        className="text-sm font-semibold text-[#1c1410]/40 underline underline-offset-2 hover:text-[#f18840] transition-colors"
                    >
                        ログイン画面に戻る
                    </Link>
                </div>
            </section>
        </div>
    );
}
