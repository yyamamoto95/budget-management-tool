"use server";

import { revalidatePath } from "next/cache";
import { serverFetch, ApiError } from "../api/client";
import { createExpenseSchema, updateExpenseSchema } from "@budget/common";
import type { GetExpenseResponse } from "../api/types";

export type ExpenseFieldErrors = {
  amount?: string[];
  balanceType?: string[];
  date?: string[];
  userId?: string[];
};

export type ExpenseActionState = {
  error: string | null;
  fieldErrors?: ExpenseFieldErrors;
  success: boolean;
};

/** 支出を新規作成する Server Action */
export async function createExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const raw = {
    amount: Number(formData.get("amount")),
    balanceType: Number(formData.get("balanceType")) as 0 | 1,
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

  // ホームページの XDayDisplay も再計算するため "/" も revalidate する
  revalidatePath("/");
  revalidatePath("/expenses");
  return { error: null, success: true };
}

export type UpdateExpenseFieldErrors = {
  amount?: string[];
  balanceType?: string[];
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

  revalidatePath("/");
  revalidatePath("/expenses");
  return { error: null, success: true };
}

/** 支出を削除する Server Action */
export async function deleteExpenseAction(id: string): Promise<void> {
  await serverFetch(`/api/expense/${id}`, { method: "DELETE" });
  revalidatePath("/");
  revalidatePath("/expenses");
}
