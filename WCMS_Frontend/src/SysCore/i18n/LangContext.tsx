import React from "react";
import type { Lang } from "./lang";

interface LangState
{
    lang: Lang;
    setLang: (l: Lang) => void;
}
const Ctx = React.createContext<LangState | null>(null);

export const LangProvider: React.FC<{ initial: Lang; children: React.ReactNode; }> = ({ initial, children }) =>
{
    const [lang, setLang] = React.useState<Lang>(initial);
    const value = React.useMemo(() => ({ lang, setLang }), [lang]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLang = () =>
{
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error("useLang must be used within LangProvider");
    return ctx;
};
