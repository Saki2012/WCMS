import React from "react";
import { LangLabelMap, type Lang } from "./lang";

interface LangState {
    // 只存語系代碼
    code: Lang;
    // 顯示名稱由代碼衍生（不要存進 state）
    label: string;
    setCode: (l: Lang) => void;
}

const Ctx = React.createContext<LangState | null>(null);

export const LangProvider: React.FC<{ initial: Lang; children: React.ReactNode }> = ({ initial, children }) => {
  const [code, setCode] = React.useState<Lang>(initial);
  React.useEffect(() => { setCode((prev) => (prev === initial ? prev : initial)); }, [initial]);
  const value = React.useMemo<LangState>(() => ({ code, label: LangLabelMap[code], setCode }), [code]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

// 想要像 useState 一樣好用也可以回傳 tuple
export const useLang = () => {
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error("useLang must be used within LangProvider");
    return ctx; // ctx.code 會是 'zh-tw' 這種代碼
};
