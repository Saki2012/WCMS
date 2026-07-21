import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

// #region Property
export type SearchPatch = { q?: string; articleLang?: string; tagId?: string; tagName?: string; author?: string; keyword?: string; includeRef?: boolean; };


type SearchActions = { setQuery: (patch: SearchPatch) => void; clearQuery: () => void; };


type Props = { basePath: string; lang: Lang; placeholder?: string; onBind?: (actions: SearchActions) => void; };



const INCLUDE_REF_QS_KEY = "includeRef";
// #endregion

// #region Public
export const SpecJournalKeywordSearch_Comp: React.FC<Props> = (props) =>
{
    // 宣告變數
    const text = getSpecJournalKeywordSearchLangText(props.lang);
    const inputId = useId();
    const includeRefId = useId();
    const nav = useNavigate();
    const location = useLocation();
    const [sp] = useSearchParams();

    const qFromUrl = useMemo(() => (sp.get("q") ?? "").trim(), [sp]);
    const includeRefFromUrl = useMemo(() => parseIncludeRef(sp.get(INCLUDE_REF_QS_KEY)), [sp]);

    const [keyword, setKeyword] = useState<string>(qFromUrl);
    const [includeRef, setIncludeRef] = useState<boolean>(includeRefFromUrl);

    // 執行 function：querystring 改變時同步 input / checkbox
    useEffect(() =>
    {
        setKeyword(qFromUrl);
        setIncludeRef(includeRefFromUrl);
    }, [qFromUrl, includeRefFromUrl]);

    const setQuery = useCallback((patch: SearchPatch) =>
    {
        // 宣告變數
        const qs = new URLSearchParams(sp);
        const pathname = resolveTargetPathname(props.basePath, location.pathname);

        // 執行 function：includeRef 可與 q 共存
        if (patch.includeRef !== undefined)
        {
            setIncludeRefQs(qs, !!patch.includeRef);
        }

        // 執行 function：互斥規則，先清空其他搜尋條件
        ["q", "articleLang", "tagId", "tagName", "author", "keyword"].forEach((k) => qs.delete(k));

        // 宣告變數：寫入單一 key
        const setOne = (key: string, val?: string): void =>
        {
            const v = (val ?? "").trim();
            if (!v) return;
            qs.set(key, v);
        };

        // 執行 function：一次只留一種條件
        if (patch.q !== undefined) setOne("q", patch.q);
        else if (patch.articleLang !== undefined) setOne("articleLang", patch.articleLang);
        else if (patch.tagId !== undefined)
        {
            setOne("tagId", patch.tagId);
            setOne("tagName", patch.tagName);
        } else if (patch.author !== undefined) setOne("author", patch.author);
        else if (patch.keyword !== undefined) setOne("keyword", patch.keyword);

        // 宣告變數
        const search = qs.toString();

        // 執行 function
        nav({ pathname, search: search ? `?${search}` : "" });
    }, [sp, props.basePath, location.pathname, nav]);

    const clearQuery = useCallback(() =>
    {
        // 宣告變數
        const qs = new URLSearchParams(sp);
        const pathname = resolveTargetPathname(props.basePath, location.pathname);

        // 執行 function：清掉所有搜尋條件
        ["q", "articleLang", "tagId", "tagName", "author", "keyword", INCLUDE_REF_QS_KEY].forEach((k) => qs.delete(k));

        // 宣告變數
        const search = qs.toString();

        // 執行 function
        nav({ pathname, search: search ? `?${search}` : "" });
    }, [sp, props.basePath, location.pathname, nav]);

    // 執行 function：綁定外部 actions
    useEffect(() =>
    {
        props.onBind?.({ setQuery, clearQuery });
    }, [props.onBind, setQuery, clearQuery]);

    const onSubmit = (e: React.FormEvent): void =>
    {
        // 執行 function
        e.preventDefault();
        setQuery({ q: keyword, includeRef });
    };

    const onToggleIncludeRef = (e: React.ChangeEvent<HTMLInputElement>): void =>
    {
        // 執行 function
        setIncludeRef(e.target.checked);
    };

    // return
    return (
        <>
            <div className="select-wrap" />
            <form className="Spec1819-JournalSearch search-wrap my-2" onSubmit={onSubmit} role="search" aria-label={text.formAriaLabel}>
                <div className="Spec1819-JournalSearch__row">
                    <div className="Spec1819-JournalSearch__field">
                        <div className="searchDIV">
                            <input
                                id={inputId}
                                className="form-control"
                                type="search"
                                value={keyword}
                                placeholder={props.placeholder ?? text.placeholder}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <button className="btn-CCsearch" type="submit" title={text.searchLabel} aria-label={text.searchLabel}>
                                <i className="far fa-search" aria-hidden="true"></i>
                                <span className="d-none">{text.searchLabel}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="Spec1819-JournalSearch__checkRow">
                    <div className="form-check">
                        <input id={includeRefId} className="form-check-input" type="checkbox" checked={includeRef} onChange={onToggleIncludeRef} />
                        <label className="form-check-label" htmlFor={includeRefId}>{text.includeReferencesLabel}</label>
                    </div>
                </div>
            </form>
        </>
    );
};
// #endregion

// #region Private
/** 解析 includeRef */
const parseIncludeRef = (v: string | null): boolean =>
{
    // 宣告變數
    const s = (v ?? "").trim().toLowerCase();

    // return
    return s === "1" || s === "true";
};


/** 設定 includeRef querystring */
const setIncludeRefQs = (qs: URLSearchParams, checked: boolean): void =>
{
    // 執行 function
    if (checked) qs.set(INCLUDE_REF_QS_KEY, "1");
    else qs.delete(INCLUDE_REF_QS_KEY);
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
// #endregion

// #region LangText
interface SpecJournalKeywordSearchLangText
{
    formAriaLabel: string;
    includeReferencesLabel: string;
    placeholder: string;
    searchLabel: string;
}
const SPEC_JOURNAL_KEYWORD_SEARCH_LANG_TEXT_MAP: Record<string, SpecJournalKeywordSearchLangText> = {
    "zh-tw": {
        formAriaLabel: "期刊關鍵字搜尋",
        includeReferencesLabel: "包含參考文獻",
        placeholder: "請輸入關鍵字進行搜尋...",
        searchLabel: "搜尋",
    },
    en: {
        formAriaLabel: "Journal keyword search",
        includeReferencesLabel: "Includes References",
        placeholder: "Enter keywords to search...",
        searchLabel: "Search",
    },
};
/** 取得期刊關鍵字搜尋文字設定。 */
const getSpecJournalKeywordSearchLangText = (lang: Lang): SpecJournalKeywordSearchLangText =>
{
    return SPEC_JOURNAL_KEYWORD_SEARCH_LANG_TEXT_MAP[lang] ?? SPEC_JOURNAL_KEYWORD_SEARCH_LANG_TEXT_MAP[DefaultLang];
};
// #endregion
