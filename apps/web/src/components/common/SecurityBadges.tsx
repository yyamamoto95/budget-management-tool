import { ShieldCheck, UserRound } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * ログイン・登録フォームに添える控えめなセキュリティバッジ。
 * クリック不要のツールチップでセキュリティ宣言を伝える。
 */
export function SecurityBadges() {
    return (
        <TooltipProvider>
            <div className="flex gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            tabIndex={0}
                            className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[#e8c8b0] bg-[#fffdf5] px-2.5 py-1 text-xs font-bold text-[#1c1410]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f18840]/40"
                        >
                            <ShieldCheck size={12} strokeWidth={2} className="text-[#35b5a2]" />
                            暗号化通信
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="space-y-1">
                            <strong className="font-bold text-[#1c1410]">
                                データ保護について
                            </strong>
                            <p className="leading-relaxed">
                                入力内容は暗号化されサーバーに安全に保存されます。ローカルストレージのみの保存ではありません。
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            tabIndex={0}
                            className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[#e8c8b0] bg-[#fffdf5] px-2.5 py-1 text-xs font-bold text-[#1c1410]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f18840]/40"
                        >
                            <UserRound size={12} strokeWidth={2} className="text-[#f18840]" />
                            匿名利用可
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="space-y-1">
                            <strong className="font-bold text-[#1c1410]">
                                プライバシー配慮
                            </strong>
                            <p className="leading-relaxed">
                                メールアドレスは不要です。匿名のままご利用いただけます。
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
