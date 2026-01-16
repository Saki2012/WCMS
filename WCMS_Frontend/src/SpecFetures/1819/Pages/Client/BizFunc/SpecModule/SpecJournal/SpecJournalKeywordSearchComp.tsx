import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export type SearchPatch = { q?: string; articleLang?: string; tagId?: string; tagName?: string; author?: string; keyword?: string };
type SearchActions = { setQuery: (patch: SearchPatch) => void; clearQuery: () => void; };

type Props = {
    basePath: string;
    placeholder?: string;
    onBind?: (actions: SearchActions) => void;
};

const DEFAULT_PLACEHOLDER = "請輸入關鍵字進行搜尋...";

export const SpecJournalKeywordSearch_Comp: React.FC<Props> = (props) => {
    // 變數宣告
    const inputId = useId();
    const nav = useNavigate();
    const [sp] = useSearchParams();

    const qFromUrl = useMemo(() => (sp.get("q") ?? "").trim(), [sp]);
    const [keyword, setKeyword] = useState<string>(qFromUrl);

    // ✅ 外部（點分類/作者/語言）改了 querystring 時，input 要同步
    useEffect(() => {
        setKeyword(qFromUrl);
    }, [qFromUrl]);

    const setQuery = useCallback((patch: SearchPatch) => {
        // 變數宣告
        const qs = new URLSearchParams(sp);

        // ✅ 互斥規則：每次選一種條件就清空其他條件
        ["q", "articleLang", "tagId", "tagName", "author", "keyword"].forEach((k) => qs.delete(k));

        // function：寫入單一 key（有值才 set，空值就不加）
        const setOne = (key: string, val?: string) => {
            const v = (val ?? "").trim();
            if (!v) return;
            qs.set(key, v);
        };

        // ✅ 只接受一次一種條件（依優先序）
        if (patch.q !== undefined) setOne("q", patch.q);
        else if (patch.articleLang !== undefined) setOne("articleLang", patch.articleLang);
        else if (patch.tagId !== undefined) { setOne("tagId", patch.tagId); setOne("tagName", patch.tagName); }
        else if (patch.author !== undefined) setOne("author", patch.author);
        else if (patch.keyword !== undefined) setOne("keyword", patch.keyword);

        // 執行 function
        nav(`${props.basePath}?${qs.toString()}`);
    }, [nav, props.basePath, sp]);

    const clearQuery = useCallback(() => {
        const qs = new URLSearchParams(sp);
        ["q", "articleLang", "tagId", "tagName", "author", "keyword"].forEach((k) => qs.delete(k));
        nav(`${props.basePath}?${qs.toString()}`);
    }, [nav, props.basePath, sp]);

    // ✅ onBind：只在引用穩定變更時綁一次
    useEffect(() => {
        props.onBind?.({ setQuery, clearQuery });
    }, [props.onBind, setQuery, clearQuery]);

    const onSubmit = (e: React.FormEvent) => {
        // NOTE: form submit 觸發搜尋
        e.preventDefault();
        setQuery({ q: keyword });
    };

    // return
    return (
        <>
            <div className="select-wrap" />
            <form className="search-wrap my-2" onSubmit={onSubmit} role="search" aria-label="期刊關鍵字搜尋">
                <label htmlFor={inputId} className="me-2">關鍵字搜尋區：</label>
                <div className="searchDIV">
                    <input
                        id={inputId}
                        className="form-control"
                        type="search"
                        value={keyword}
                        placeholder={props.placeholder ?? DEFAULT_PLACEHOLDER}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button type="submit" title="搜尋" aria-label="搜尋">
                        <i className="far fa-search" aria-hidden="true"></i>
                        <span className="d-none">搜尋</span>
                    </button>
                </div>
            </form>
        </>
    );
};
