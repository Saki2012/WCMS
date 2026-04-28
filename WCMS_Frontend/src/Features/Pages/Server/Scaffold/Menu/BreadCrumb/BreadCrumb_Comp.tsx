// src/SysCore/Components/BreadCrumb/BreadCrumb_Comp.tsx
import { type RouteHandleMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import BreadCrumbComp from "@/SysCore/Components/BreadCrumb/BreadCrumb_Comp";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import React from "react";
import { useMatches } from "react-router-dom";

const BreadCrumb = ({ theme }: { theme: IBETheme; }) =>
{
    // 1) 從當前匹配到的所有路由收集麵包屑文字
    const matches = useMatches();
    const crumbs: React.ReactNode[] = matches.map((m, i, arr) =>
    {
        const meta = m.handle as RouteHandleMeta | undefined;
        const label = meta?.title;
        if (!label) return null;
        const isLast = i === arr.length - 1;
        return (
            <>
                {isLast
                    ? <span aria-current="page">{label}</span>
                    : <LangNavLink to={m.pathname} aria-label={meta?.title || String(label)}>{label}</LangNavLink>}
            </>
        );
    }).filter(Boolean) as React.ReactNode[]; // ← 這裡就是 node[] 型別
    // 2) 輸出 AA 友善的 <nav><ol>，最後一顆加 aria-current="page"
    return <BreadCrumbComp items={crumbs} style={theme.BreadCrumb}></BreadCrumbComp>;
};

export default BreadCrumb;
