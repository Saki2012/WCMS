// src/SysCore/Components/BreadCrumb/BreadCrumb_Comp.tsx
import React from "react";
import { Link, useMatches } from "react-router-dom";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { resolveCrumb, type RouteHandleMeta } from "@/Features/Pages/Server/ServerRouter";
import BreadCrumbComp from "@/SysCore/Components/BreadCrumb/BreadCrumb_Comp";

const BreadCrumb = ({ theme }: { theme: IBETheme }) => {
    // 1) 從當前匹配到的所有路由收集麵包屑文字
    const matches = useMatches();
    const crumbs: React.ReactNode[] = matches
        .map((m, i, arr) => {
            const meta = m.handle as RouteHandleMeta | undefined;
            const label = resolveCrumb(meta, m);
            if (!label) return null;
            const isLast = i === arr.length - 1;
            return (
                <>
                    {isLast ? (
                        <span aria-current="page">{label}</span>
                    ) : (
                        <Link to={m.pathname} aria-label={meta?.ariaLabel || String(label)}>
                            {label}
                        </Link>
                    )}
                </>
            );
        })
        .filter(Boolean) as React.ReactNode[]; // ← 這裡就是 node[] 型別
    // 2) 輸出 AA 友善的 <nav><ol>，最後一顆加 aria-current="page"
    return (
        <BreadCrumbComp items={crumbs} style={theme.BreadCrumb}></BreadCrumbComp>
    );
};

export default BreadCrumb;
