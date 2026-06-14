"use client";

import { useActionState, useState, useEffect } from "react";
import { registerAction } from "@/lib/actions/register";
import type { RegisterState } from "@/lib/actions/register";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";
import { UserNameInput } from "@/components/common/UserNameInput";
import { SecurityBadges } from "@/components/common/SecurityBadges";
import { publicFetch } from "@/lib/api/public-client";
import Link from "next/link";

interface SecurityQuestion {
    id: number;
    text: string;
}

function FieldError({ messages }: { messages?: string[] }) {
    if (!messages?.length) return null;
    return <p className="mt-1 text-xs font-medium text-[#f87171]">{messages[0]}</p>;
}

export function RegisterForm() {
    const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
        registerAction,
        { error: null }
    );

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
    const [questionsError, setQuestionsError] = useState(false);

    useEffect(() => {
        publicFetch<{ questions: SecurityQuestion[] }>("/security-questions")
            .then((res) => setQuestions(res.questions))
            .catch(() => setQuestionsError(true));
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-4 py-12">
            {/* 背景の幾何学デコレーション */}
            <div
                className="pointer-events-none fixed left-8 top-20 h-16 w-16 rounded-full border border-[#f18840]/20 bg-[#fff6ee]"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none fixed right-12 bottom-24 h-10 w-10 rotate-12 rounded-md border border-[#35b5a2]/20 bg-[#ecfaf8]"
                aria-hidden="true"
            />

            <section
                className="w-full max-w-md rounded-2xl border border-[rgba(28,20,16,0.08)] bg-white p-8"
                style={{ boxShadow: "var(--shadow-card)" }}
            >
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(28,20,16,0.08)] bg-[#f18840] text-base font-extrabold text-white"
                            style={{ boxShadow: "0 1px 4px rgba(28,20,16,0.08)" }}
                        >
                            B
                        </span>
                        <div>
                            <h1 className="text-xl font-extrabold text-[#1c1410] leading-tight">
                                アカウント登録
                            </h1>
                            <p className="text-xs text-[#1c1410]/50">まず無料ではじめよう</p>
                        </div>
                    </div>
                    <SecurityBadges />
                </div>

                <form action={formAction} className="flex flex-col gap-4">
                    {/* ユーザー名（debounce付き重複チェック） */}
                    <UserNameInput
                        value={userId}
                        onChange={setUserId}
                        error={state.fieldErrors?.userId?.[0]}
                        disabled={isPending}
                    />
                    <input type="hidden" name="userId" value={userId} />

                    {/* 表示名 */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="displayName" className="text-sm font-semibold text-[#1c1410]">
                            表示名{" "}
                            <span className="font-normal text-[#1c1410]/40">（省略可・後から変更可）</span>
                        </label>
                        <input
                            id="displayName"
                            name="displayName"
                            type="text"
                            autoComplete="name"
                            placeholder="ニックネームなど（省略時はユーザー名と同じ）"
                            className="input-pop"
                        />
                        <FieldError messages={state.fieldErrors?.displayName} />
                    </div>

                    {/* パスワード（強度メーター付き） */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm font-semibold text-[#1c1410]">
                            パスワード
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder="8文字以上"
                            className="input-pop"
                        />
                        <PasswordStrengthMeter password={password} />
                        <FieldError messages={state.fieldErrors?.password} />
                    </div>

                    {/* 秘密の質問 */}
                    <div className="rounded-xl border border-[rgba(28,20,16,0.08)] bg-[#fffdf5] p-4 space-y-3">
                        <p className="text-sm font-extrabold text-[#1c1410]">
                            秘密の質問
                        </p>
                        <p className="text-xs text-[#1c1410]/50">
                            万が一パスワードを忘れても、この質問があれば安心して再設定できます
                        </p>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="securityQuestionId" className="text-xs font-bold text-[#1c1410]/60">
                                質問を選択
                            </label>
                            {questionsError ? (
                                <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-xs font-medium text-[#1c1410]">
                                    質問の読み込みに失敗しました。APIサーバーが起動しているか確認してください。
                                </p>
                            ) : (
                                <select
                                    id="securityQuestionId"
                                    name="securityQuestionId"
                                    disabled={questions.length === 0}
                                    className="input-pop disabled:opacity-50"
                                >
                                    <option value="">
                                        {questions.length === 0 ? "読み込み中..." : "-- 質問を選んでください --"}
                                    </option>
                                    {questions.map((q) => (
                                        <option key={q.id} value={q.id}>{q.text}</option>
                                    ))}
                                </select>
                            )}
                            <FieldError messages={state.fieldErrors?.securityQuestionId} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="securityAnswer" className="text-xs font-bold text-[#1c1410]/60">
                                回答
                            </label>
                            <input
                                id="securityAnswer"
                                name="securityAnswer"
                                type="text"
                                autoComplete="off"
                                placeholder="回答を入力（大文字・小文字は区別されません）"
                                className="input-pop"
                            />
                            <FieldError messages={state.fieldErrors?.securityAnswer} />
                        </div>
                    </div>

                    {state.error && (
                        <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
                            {state.error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn-candy w-full mt-2 disabled:opacity-50"
                    >
                        {isPending ? "登録中..." : "アカウントを作成する"}
                    </button>
                </form>

                <div className="mt-4 border-t border-[rgba(28,20,16,0.08)] pt-4 text-center">
                    <p className="text-sm text-[#1c1410]/60">
                        すでにアカウントをお持ちですか？{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-[#f18840] underline underline-offset-2 hover:text-[#e07030] transition-colors"
                        >
                            ログイン
                        </Link>
                    </p>
                </div>
            </section>
        </div>
    );
}
