import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SearchPatch } from "./SpecJournalKeywordSearchComp";

/** 把 patch 轉成互斥 query（只保留一種條件） */
const normalizeExclusivePatch = (patch: SearchPatch): SearchPatch =>
{
    // 宣告變數
    if (patch.q !== undefined) return { q: patch.q, includeRef: patch.includeRef };
    if (patch.articleLang !== undefined) return { articleLang: patch.articleLang };
    if (patch.tagId !== undefined) return { tagId: patch.tagId, tagName: patch.tagName };
    if (patch.author !== undefined) return { author: patch.author };
    if (patch.keyword !== undefined) return { keyword: patch.keyword };

    // return
    return {};
};

/** 解析目標 pathname（支援 "." 相對當前頁） */
const resolveTargetPathname = (basePath: string, currentPathname: string): string =>
{
    // 宣告變數
    const path = (basePath ?? "").trim();

    // return
    if (!path || path === ".") return currentPathname;
    return path;
};

/** 建立搜尋 querystring */
const buildExclusiveSearch = (patch: SearchPatch): string =>
{
    // 宣告變數
    const p = normalizeExclusivePatch(patch);
    const qs = new URLSearchParams();

    // 宣告變數
    const setOne = (key: string, val?: string): void =>
    {
        const v = (val ?? "").trim();
        if (!v) return;
        qs.set(key, v);
    };

    // 執行 function：互斥條件
    if (p.q !== undefined)
    {
        setOne("q", p.q);
        if (p.includeRef) qs.set("includeRef", "1");
    } else if (p.articleLang !== undefined)
    {
        setOne("articleLang", p.articleLang);
    } else if (p.tagId !== undefined)
    {
        setOne("tagId", p.tagId);
        setOne("tagName", p.tagName);
    } else if (p.author !== undefined)
    {
        setOne("author", p.author);
    } else if (p.keyword !== undefined)
    {
        setOne("keyword", p.keyword);
    }

    // return
    return qs.toString();
};

export const useSpecJournalSearchNav = (basePath: string) =>
{
    // 宣告變數
    const nav = useNavigate();
    const location = useLocation();

    const goExclusive = useCallback((patch: SearchPatch) =>
    {
        // 宣告變數
        const pathname = resolveTargetPathname(basePath, location.pathname);
        const search = buildExclusiveSearch(patch);

        // 執行 function
        nav({ pathname, search: search ? `?${search}` : "" });
    }, [nav, basePath, location.pathname]);

    // return
    return { goExclusive };
};
