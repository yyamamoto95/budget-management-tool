'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertSettingsAction } from '@/lib/actions/settings'

type Props = {
    paydayDay: number
    monthlyIncome: number
    fixedExpenses: number
    totalAssets: number
}

export function HouseholdSettingsSection({ paydayDay, monthlyIncome, fixedExpenses, totalAssets }: Props) {
    const [state, action, isPending] = useActionState(upsertSettingsAction, { error: null, success: false })

    return (
        <div
            className="rounded-2xl border-2 border-[#1c1410] bg-white p-6 space-y-4"
            style={{ boxShadow: 'var(--shadow-pop)' }}
        >
            <h2 className="text-base font-extrabold text-[#1c1410]">家計基本設定</h2>

            {state.success && (
                <p role="status" className="text-sm font-semibold text-green-600">
                    保存しました
                </p>
            )}
            {state.error && (
                <p role="alert" className="text-sm font-semibold text-red-600">
                    {state.error}
                </p>
            )}

            <form action={action} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="paydayDay">給料日（1〜31日）</Label>
                    <Input
                        id="paydayDay"
                        name="paydayDay"
                        type="number"
                        min={1}
                        max={31}
                        defaultValue={paydayDay}
                        required
                        aria-label="給料日"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="monthlyIncome">月収（円）</Label>
                    <Input
                        id="monthlyIncome"
                        name="monthlyIncome"
                        type="number"
                        min={0}
                        defaultValue={monthlyIncome}
                        required
                        aria-label="月収"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="fixedExpenses">固定費 月合計（円）</Label>
                    <Input
                        id="fixedExpenses"
                        name="fixedExpenses"
                        type="number"
                        min={0}
                        defaultValue={fixedExpenses}
                        required
                        aria-label="固定費"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="totalAssets">現在の総資産（円）</Label>
                    <Input
                        id="totalAssets"
                        name="totalAssets"
                        type="number"
                        min={0}
                        defaultValue={totalAssets}
                        required
                        aria-label="現在の総資産"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="btn-candy w-full"
                >
                    {isPending ? '保存中...' : '保存'}
                </button>
            </form>
        </div>
    )
}
