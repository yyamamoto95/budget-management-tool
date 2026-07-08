"use server";

import { serverFetch, ApiError } from "../api/client";
import { createExpenseSchema, updateExpenseSchema } from "@budget/common";
import type { GetExpenseResponse } from "../api/types";

export type ExpenseFieldErrors = {
  amount?: string[];
  balanceType?: string[];
  categoryId?: string[];
  date?: string[];
  userId?: string[];
};

export type ExpenseActionState = {
  error: string | null;
  fieldErrors?: ExpenseFieldErrors;
  success: boolean;
  /** 登録に成功した金額（生活余力の即時フィードバック表示に使用） */
  registeredAmount?: number;
  /** 登録に成功した収支区分（0: 支出 / 1: 収入） */
  registeredBalanceType?: 0 | 1;
};

/** 支出を新規作成する Server Action */
export async function createExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const raw = {
    amount: Number(formData.get("amount")),
    balanceType: Number(formData.get("balanceType")) as 0 | 1,
    categoryId: Number(formData.get("categoryId") ?? 0),
    userId: String(formData.get("userId") ?? ""),
    date: String(formData.get("date") ?? ""),
    content: formData.get("content") ? String(formData.get("content")) : null,
  };

  const result = createExpenseSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as ExpenseFieldErrors;
    return { error: null, fieldErrors, success: false };
  }

  try {
    await serverFetch<GetExpenseResponse>("/api/expense", {
      method: "POST",
      body: JSON.stringify({ newData: result.data }),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 403) {
        return { error: "認証が必要です", success: false };
      }
    }
    return { error: "支出の登録に失敗しました", success: false };
  }

  // 注意: ここで revalidatePath を呼んではならない（#437）。
  // action 応答に RSC 再レンダーが同梱されると、遅い環境で useActionState の
  // isPending が解除されないクライアント側ハングが発生する。
  // 画面データの更新は呼び出し側が成功後に router.refresh() で行う。
  return {
    error: null,
    success: true,
    registeredAmount: result.data.amount,
    registeredBalanceType: result.data.balanceType,
  };
}

export type UpdateExpenseFieldErrors = {
  amount?: string[];
  balanceType?: string[];
  categoryId?: string[];
  date?: string[];
};

export type UpdateExpenseActionState = {
  error: string | null;
  fieldErrors?: UpdateExpenseFieldErrors;
  success: boolean;
};

/** 支出を更新する Server Action */
export async function updateExpenseAction(
  id: string,
  _prev: UpdateExpenseActionState,
  formData: FormData,
): Promise<UpdateExpenseActionState> {
  const raw = {
    amount: Number(formData.get("amount")),
    balanceType: Number(formData.get("balanceType")) as 0 | 1,
    categoryId: Number(formData.get("categoryId") ?? 0),
    date: String(formData.get("date") ?? ""),
    content: formData.get("content") ? String(formData.get("content")) : null,
  };

  const result = updateExpenseSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as UpdateExpenseFieldErrors;
    return { error: null, fieldErrors, success: false };
  }

  try {
    await serverFetch<GetExpenseResponse>(`/api/expense/${id}`, {
      method: "PUT",
      body: JSON.stringify({ updateData: result.data }),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 403) {
        return { error: "認証が必要です", success: false };
      }
      if (err.status === 404) {
        return { error: "支出が見つかりません", success: false };
      }
    }
    return { error: "支出の更新に失敗しました", success: false };
  }

  // revalidatePath は使わない（#437: isPending ハングの原因）。呼び出し側で router.refresh() する
  return { error: null, success: true };
}

/** 支出を削除する Server Action（呼び出し側で成功後に router.refresh() すること。#437） */
export async function deleteExpenseAction(id: string): Promise<void> {
  await serverFetch(`/api/expense/${id}`, { method: "DELETE" });
}
