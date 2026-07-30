import searchBg from "@/SpecFetures/1816/Assets/Client/images/bg/search_bg.jpg";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type React from "react";
import { useCallback, useId, useMemo, useRef } from "react";

// #region Property
const urlBase =
    "https://tnua.on.worldcat.org/external-search?queryString=#T#&databaseList=&clusterResults=on&groupVariantRecords=off&stickyFacetsChecked=on&baseScope=wz%3A11833#F#";
// #endregion

// #region Public
export const SearchData = (props: { lang: Lang; }) =>
{
    // 宣告變數：輸入框 ref
    const inputRef = useRef<HTMLInputElement | null>(null);
    const reactId = useId();
    const inputId = useMemo(() => `wcms_search_${reactId.replace(/:/g, "")}`, [reactId]);
    // 宣告變數：UI 文案（依語系）
    const uiText = useMemo(() =>
    {
        if (props.lang === "en")
        {
            return {
                inputLabel: "Search library resources",
                placeholder: "Find books, media, theses, articles & more ...",
                btn1: "Integrated Search",
                btn2: "Database List",
                btn3: "E-Journal List",
                btn1Title: "Integrated Library Search (opens in new window)",
                btn2Title: "Database List",
                btn3Title: "E-Journal List",
                databaseLink: "https://sites.google.com/view/tnualib-en/e-resources/database-list",
            };
        }

        // 預設 zh-tw（與 prototype 文字一致）
        return {
            inputLabel: "館藏整合搜尋關鍵字",
            placeholder: "查詢本館可用的資料 ( 書籍、影音資料、本校學位論文、資料庫內容、期刊文章 ) ...",
            btn1: "館藏整合搜尋",
            btn2: "資料庫列表",
            btn3: "電子期刊列表",
            btn1Title: "館藏整合搜尋 (另開視窗)",
            btn2Title: "資料庫列表",
            btn3Title: "電子期刊列表",
            databaseLink: "https://sites.google.com/view/tnualib/%E9%9B%BB%E5%AD%90%E8%B3%87%E6%BA%90/%E8%B3%87%E6%96%99%E5%BA%AB%E5%88%97%E8%A1%A8",
        };
    }, [props.lang]);

    // 執行 function：整合搜尋（對標 prototype 的 js_method）
    const handleSearch = useCallback((e: React.FormEvent | React.MouseEvent) =>
    {
        // ✅ 阻止 a / form 預設行為
        e.preventDefault();
        e.stopPropagation();

        // ✅ 取目前可見的 input
        const raw = inputRef.current?.value ?? "";
        const query = raw.trim();
        if (!query) return;

        // ✅ 若未來要加 facet，可在這裡組
        const facets = "";
        const url = urlBase.replace("#T#", encodeURIComponent(query)).replace("#F#", facets);
        const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
        openedWindow?.focus();
    }, []);

    return (
        <section className="ResourceSearch_section Layout_Padding_2" style={{ backgroundImage: `url(${searchBg})` }}>
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize4">
                        <div className="Form_Search_DIV">
                            <div className="Search-content tab-content" id="TabContent">
                                <div className="tab-pane fade active show" id="search_01">
                                    <div className="row align-items-start no-gutters">
                                        <div className="b-main-filter__main col-lg px-0">
                                            <div className="b-main-filter__inner row no-gutters">
                                                <div className="float-md-left float-sm-none">
                                                    <label htmlFor={inputId} className="visually-hidden">{uiText.inputLabel}</label>

                                                    <input
                                                        ref={inputRef}
                                                        className="Searchform-control"
                                                        defaultValue=""
                                                        id={inputId}
                                                        title={uiText.inputLabel}
                                                        aria-label={uiText.inputLabel}
                                                        placeholder={uiText.placeholder}
                                                        tabIndex={0}
                                                        type="text"
                                                    />
                                                </div>

                                                <LangLink className="Search_btn btn s-c" to="#" onClick={handleSearch} title={uiText.btn1Title} type="button">
                                                    {uiText.btn1}
                                                    <span className="fas fa-search ms-2" />
                                                </LangLink>
                                            </div>
                                        </div>

                                        <div className="col-lg-auto mt-xl-0 mt-lg-0 mt-md-2 mt-sm-2 mt-2">
                                            <LangLink className="Search_btn btn" to={uiText.databaseLink} title={uiText.btn2Title} type="button">
                                                {uiText.btn2}
                                                <span className="fas fa-search ms-2" />
                                            </LangLink>
                                        </div>

                                        <div className="col-lg-auto mt-xl-0 mt-lg-0 mt-md-2 mt-sm-2 mt-2">
                                            <LangLink
                                                className="Search_btn btn"
                                                to="https://tnua.on.worldcat.org/atoztitles/browse/journals"
                                                title={uiText.btn3Title}
                                                type="button"
                                            >
                                                {uiText.btn3}
                                                <span className="fas fa-search ms-2" />
                                            </LangLink>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* //Form_Search_DIV */}
                    </div>
                </div>
                {/* //customizeBox */}
            </div>
            {/* //Mask-DivBox */}
        </section>
    );
};
// #endregion
