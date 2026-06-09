import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import type { ReactNode } from "react";

// #region Property
type ShortcutModel = components["schemas"]["SpecHomePage1821_Shortcut_DTO"];

const MAX_SHORTCUT_COUNT = 5;
// #endregion

// #region Public
/** Section2：固定 5 個快捷按鈕，功能串聯暫定 */
export const Section2 = (props: { lang: Lang; data: ShortcutModel[]; }) =>
{
    const shortcuts = (props.data ?? []).slice(0, MAX_SHORTCUT_COUNT);
    if (shortcuts.length === 0) return null;

    return (
        <section className="spec1821-shortcut" aria-label="招生快捷功能">
            <div className="spec1821-shortcut__list">{shortcuts.map((item) => renderShortcut(item, props.lang))}</div>
        </section>
    );
};
// #endregion

// #region EntityComp
/** 渲染快捷按鈕 */
const renderShortcut = (item: ShortcutModel, lang: Lang) =>
{
    const content = renderShortcutContent(item);
    if (!hasLink(item.Link)) return renderPendingShortcut(item, content);

    return (
        <LangLink
            key={`${item.HomePageId}-${item.RowId}`}
            to={item.Link ?? ""}
            lang={lang}
            className="spec1821-shortcut__item"
            title={item.Title ?? ""}
            aria-label={getShortcutLabel(item)}
            data-action-type={item.ActionType ?? ""}
            data-action-value={item.ActionValue ?? ""}
        >
            {content}
        </LangLink>
    );
};

/** 渲染暫定功能按鈕 */
const renderPendingShortcut = (item: ShortcutModel, content: ReactNode) =>
{
    return (
        <div key={`${item.HomePageId}-${item.RowId}`} className="spec1821-shortcut__item is-pending" aria-label={`${getShortcutLabel(item)}（功能暫定）`}>
            {content}
        </div>
    );
};

/** 渲染快捷按鈕內容 */
const renderShortcutContent = (item: ShortcutModel) =>
{
    return (
        <>
            {item.IconFileId && <img className="spec1821-shortcut__icon" src={FileManagementAPI.get_Public_Preview_Url(item.IconFileId)} alt={item.IconFileDescription ?? ""} />}
            <span className="spec1821-shortcut__title">{item.Title}</span>
            {item.SubTitle && <span className="spec1821-shortcut__subtitle">{item.SubTitle}</span>}
        </>
    );
};
// #endregion

// #region Private
/** 判斷是否有連結 */
const hasLink = (link?: string | null) =>
{
    return !!link?.trim();
};

/** 取得快捷按鈕說明 */
const getShortcutLabel = (item: ShortcutModel) =>
{
    return item.Title || item.SubTitle || "招生快捷功能";
};
// #endregion
