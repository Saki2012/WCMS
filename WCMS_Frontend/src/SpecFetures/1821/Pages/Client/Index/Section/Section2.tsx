import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";

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
            <div className="spec1821-shortcut__list">
                {shortcuts.map((item) => <ShortcutItem key={`${item.HomePageId}-${item.RowId}`} item={item} lang={props.lang} />)}
            </div>
        </section>
    );
};
// #endregion

// #region EntityComp
/** 快捷按鈕項目 */
const ShortcutItem = (props: { item: ShortcutModel; lang: Lang; }) =>
{
    if (!LibText.isNonEmptyString(props.item.Link)) return <PendingShortcutItem item={props.item} />;

    return (
        <LangLink
            to={props.item.Link ?? ""}
            lang={props.lang}
            className="spec1821-shortcut__item"
            title={props.item.Title ?? ""}
            aria-label={getShortcutLabel(props.item)}
            data-action-type={props.item.ActionType ?? ""}
            data-action-value={props.item.ActionValue ?? ""}
        >
            <ShortcutContent item={props.item} />
        </LangLink>
    );
};

/** 暫定功能快捷按鈕 */
const PendingShortcutItem = (props: { item: ShortcutModel; }) =>
{
    return (
        <div className="spec1821-shortcut__item is-pending" aria-label={`${getShortcutLabel(props.item)}（功能暫定）`}>
            <ShortcutContent item={props.item} />
        </div>
    );
};

/** 快捷按鈕內容 */
const ShortcutContent = (props: { item: ShortcutModel; }) =>
{
    return (
        <>
            {props.item.IconFileId && (
                <img className="spec1821-shortcut__icon" src={FileManagementAPI.get_Public_Preview_Url(props.item.IconFileId)} alt={props.item.IconFileDescription ?? ""} />
            )}
            <span className="spec1821-shortcut__title">{props.item.Title}</span>
            {props.item.SubTitle && <span className="spec1821-shortcut__subtitle">{props.item.SubTitle}</span>}
        </>
    );
};
// #endregion

// #region Private
/** 取得快捷按鈕說明 */
const getShortcutLabel = (item: ShortcutModel) =>
{
    return item.Title || item.SubTitle || "招生快捷功能";
};
// #endregion
