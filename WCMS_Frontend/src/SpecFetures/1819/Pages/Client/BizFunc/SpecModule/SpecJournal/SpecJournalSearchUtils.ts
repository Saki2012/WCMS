import { useCallback } from "react";
import { useNavigate } from "react-router";
import type { SearchPatch } from "./SpecJournalKeywordSearchComp";

// function：把 patch 轉成互斥 query string（只留一種條件）
const normalizeExclusivePatch = (patch: SearchPatch): SearchPatch =>
{
    // 變數宣告
    if (patch.q !== undefined) return { q: patch.q };
    if (patch.articleLang !== undefined) return { articleLang: patch.articleLang };
    if (patch.tagId !== undefined) return { tagId: patch.tagId, tagName: patch.tagName };
    if (patch.author !== undefined) return { author: patch.author };
    if (patch.keyword !== undefined) return { keyword: patch.keyword };
    return {};
};

const buildSpecJournalExclusiveListUrl = (basePath: string, patch: SearchPatch) =>
{
    // 變數宣告
    const p = normalizeExclusivePatch(patch);
    const qs = new URLSearchParams();

    // function：寫入單一 key
    const setOne = (key: string, val?: string) =>
    {
        const v = (val ?? "").trim();
        if (!v) return;
        qs.set(key, v);
    };

    // 執行 function（互斥只會成立一種）
    if (p.q !== undefined) setOne("q", p.q);
    else if (p.articleLang !== undefined) setOne("articleLang", p.articleLang);
    else if (p.tagId !== undefined)
    {
        setOne("tagId", p.tagId);
        setOne("tagName", p.tagName);
    } else if (p.author !== undefined) setOne("author", p.author);
    else if (p.keyword !== undefined) setOne("keyword", p.keyword);

    // return
    const query = qs.toString();
    return query ? `${basePath}?${query}` : "";
};

export const useSpecJournalSearchNav = (basePath: string) =>
{
    // 變數宣告
    const nav = useNavigate();
    // function：互斥導頁（只帶一種搜尋條件）
    const goExclusive = useCallback((patch: SearchPatch) =>
    {
        // 變數宣告
        const url = buildSpecJournalExclusiveListUrl(basePath, patch);
        if (!url) return;
        // 執行 function
        nav(url);
    }, [nav, basePath]);
    // return
    return { goExclusive };
};
