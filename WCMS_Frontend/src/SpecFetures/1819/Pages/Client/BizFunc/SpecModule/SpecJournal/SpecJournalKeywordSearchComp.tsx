import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export type SearchPatch = {
    q?: string;
    articleLang?: string;
    tagId?: string;
    tagName?: string;
    author?: string;
    keyword?: string;
    includeRef?: boolean;
};

type SearchActions = { setQuery: (patch: SearchPatch) => void; clearQuery: () => void; };

type Props = {
    basePath: string;
    placeholder?: string;
    onBind?: (actions: SearchActions) => void;
};

const DEFAULT_PLACEHOLDER = "請輸入關鍵字進行搜尋...";
const INCLUDE_REF_QS_KEY = "includeRef";

const parseIncludeRef = (v: string | null): boolean => {
    // NOTE: 支援 includeRef=1 / true
    const s = (v ?? "").trim().toLowerCase();
    return s === "1" || s === "true";
};

const setIncludeRefQs = (qs: URLSearchParams, checked: boolean) => {
    // NOTE: 勾選才寫入，未勾選就移除，避免 querystring 太髒
    if (checked) qs.set(INCLUDE_REF_QS_KEY, "1");
    else qs.delete(INCLUDE_REF_QS_KEY);
};

export const SpecJournalKeywordSearch_Comp: React.FC<Props> = (props) => {
    // 變數宣告
    const inputId = useId();
    const includeRefId = useId();
    const nav = useNavigate();
    const [sp] = useSearchParams();

    const qFromUrl = useMemo(() => (sp.get("q") ?? "").trim(), [sp]);
    const includeRefFromUrl = useMemo(() => parseIncludeRef(sp.get(INCLUDE_REF_QS_KEY)), [sp]);

    const [keyword, setKeyword] = useState<string>(qFromUrl);
    const [includeRef, setIncludeRef] = useState<boolean>(includeRefFromUrl);

    // ✅ 外部改了 querystring 時，input/checkbox 要同步
    useEffect(() => {
        setKeyword(qFromUrl);
        setIncludeRef(includeRefFromUrl);
    }, [qFromUrl, includeRefFromUrl]);

    const setQuery = useCallback((patch: SearchPatch) => {
        // 變數宣告
        const qs = new URLSearchParams(sp);

        // ✅ includeRef：可與 q 共存（先處理）
        if (patch.includeRef !== undefined) {
            setIncludeRefQs(qs, !!patch.includeRef);
        }

        // ✅ 互斥規則：每次選一種條件就清空其他條件（但不清 includeRef）
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
        // NOTE: 清掉所有搜尋條件（含 includeRef）
        const qs = new URLSearchParams(sp);
        ["q", "articleLang", "tagId", "tagName", "author", "keyword", INCLUDE_REF_QS_KEY].forEach((k) => qs.delete(k));
        nav(`${props.basePath}?${qs.toString()}`);
    }, [nav, props.basePath, sp]);

    // ✅ onBind：只在引用穩定變更時綁一次
    useEffect(() => {
        props.onBind?.({ setQuery, clearQuery });
    }, [props.onBind, setQuery, clearQuery]);

    const onSubmit = (e: React.FormEvent) => {
        // NOTE: form submit 才觸發搜尋
        e.preventDefault();
        setQuery({ q: keyword, includeRef });
    };

    const onToggleIncludeRef = (e: React.ChangeEvent<HTMLInputElement>) => {
        // NOTE: 只更新 local state，不立刻導頁/搜尋
        setIncludeRef(e.target.checked);
    };

    // return
    return (
        <>
            <div className="select-wrap" />
            <form
                className="Spec1819-JournalSearch search-wrap my-2"
                onSubmit={onSubmit}
                role="search"
                aria-label="期刊關鍵字搜尋"
            >
                <div className="Spec1819-JournalSearch__row">


                    <div className="Spec1819-JournalSearch__field">
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
                    </div>
                </div>

                <div className="Spec1819-JournalSearch__checkRow">
                    <div className="form-check">
                        <input
                            id={includeRefId}
                            className="form-check-input"
                            type="checkbox"
                            checked={includeRef}
                            onChange={onToggleIncludeRef}
                        />
                        <label className="form-check-label" htmlFor={includeRefId}>
                            包含參考文獻
                        </label>
                    </div>
                </div>
            </form>
        </>
    );
};
