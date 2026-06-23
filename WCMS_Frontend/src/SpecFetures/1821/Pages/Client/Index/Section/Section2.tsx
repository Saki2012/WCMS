import {
    type AnnouncementSet,
    type FileArchiveSet,
    HomePageModuleType,
    type HomePageShortcutModuleViewModel,
    type HomePageShortcutViewModel,
    type SpecHomePage1821Shortcut,
} from "@/SpecFetures/1821/Hooks/WEB/HomePage_Types";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate, LibText } from "@/SysCore/Utils/Library/LibData";
import { useMemo, useState } from "react";

// #region Public
export const Section2 = (props: {
    lang: Lang;
    data: HomePageShortcutViewModel[];
}) =>
{
    const shortcuts = props.data ?? [];
    const [activeIndex, setActiveIndex] = useState(0);
    const safeIndex = getSafeIndex(activeIndex, shortcuts.length);
    const activeItem = shortcuts[safeIndex] ?? null;

    if (shortcuts.length === 0) return null;

    return (
        <section className="spec1821-shortcut" aria-label="招生資訊捷徑">
            <div
                className="spec1821-shortcut__list"
                role="tablist"
                aria-label="招生資訊分類"
            >
                {shortcuts.map((item, index) => (
                    <ShortcutTabButton
                        key={`${item.shortcut.HomePageId}-${item.shortcut.RowId}`}
                        item={item.shortcut}
                        index={index}
                        active={index === safeIndex}
                        onSelect={setActiveIndex}
                    />
                ))}
            </div>
            {activeItem && (
                <div
                    className="spec1821-shortcut__panel"
                    role="tabpanel"
                    aria-labelledby={getTabId(activeItem.shortcut, safeIndex)}
                >
                    <ShortcutPanel lang={props.lang} item={activeItem} />
                </div>
            )}
        </section>
    );
};
// #endregion

// #region EntityComp
const ShortcutTabButton = (props: {
    item: SpecHomePage1821Shortcut;
    index: number;
    active: boolean;
    onSelect: (index: number) => void;
}) =>
{
    return (
        <button
            type="button"
            id={getTabId(props.item, props.index)}
            className="spec1821-shortcut__item"
            role="tab"
            aria-selected={props.active}
            onClick={() => props.onSelect(props.index)}
            data-action-type={props.item.ActionType ?? ""}
            data-action-value={props.item.ActionValue ?? ""}
        >
            <ShortcutContent item={props.item} />
        </button>
    );
};

const ShortcutPanel = (props: {
    lang: Lang;
    item: HomePageShortcutViewModel;
}) =>
{
    if (props.item.shortcut.IsLink === true)
    {
        return <ShortcutLinkPanel lang={props.lang} item={props.item.shortcut} />;
    }
    if (props.item.modules.length === 0) return null;

    return (
        <div className="spec1821-shortcut-module">
            {props.item.modules.map((module) => (
                <ShortcutModule
                    key={`${module.setting.ParentRowId}-${module.setting.RowId}`}
                    lang={props.lang}
                    module={module}
                />
            ))}
        </div>
    );
};

const ShortcutContent = (props: { item: SpecHomePage1821Shortcut; }) =>
{
    return (
        <>
            {props.item.IconFileId && (
                <img
                    className="spec1821-shortcut__icon"
                    src={FileManagementAPI.get_Public_Preview_Url(props.item.IconFileId)}
                    alt={props.item.IconFileDescription ?? ""}
                />
            )}
            <span className="spec1821-shortcut__title">{props.item.Title}</span>
            {props.item.SubTitle && (
                <span className="spec1821-shortcut__subtitle">
                    {props.item.SubTitle}
                </span>
            )}
        </>
    );
};

const ShortcutLinkPanel = (props: {
    lang: Lang;
    item: SpecHomePage1821Shortcut;
}) =>
{
    const title = props.item.Title ?? "";
    const hasLink = LibText.isNonEmptyString(props.item.Link);

    return (
        <div className="spec1821-shortcut-link">
            {props.item.LinkPicId && (
                <img
                    className="spec1821-shortcut-link__image"
                    src={FileManagementAPI.get_Public_Preview_Url(props.item.LinkPicId)}
                    alt={title}
                />
            )}
            <div className="spec1821-shortcut-link__content">
                <h3>{title}</h3>
                {props.item.SubTitle && <p>{props.item.SubTitle}</p>}
                {hasLink && (
                    <LangLink
                        to={props.item.Link ?? ""}
                        lang={props.lang}
                        className="spec1821-more-link"
                        title={title}
                    >
                        View More
                    </LangLink>
                )}
            </div>
        </div>
    );
};

const ShortcutModule = (props: {
    lang: Lang;
    module: HomePageShortcutModuleViewModel;
}) =>
{
    if (props.module.moduleType === HomePageModuleType.Announcement)
    {
        return <AnnouncementModule lang={props.lang} module={props.module} />;
    }
    if (props.module.moduleType === HomePageModuleType.FileArchive)
    {
        return <FileArchiveModule lang={props.lang} module={props.module} />;
    }
    return null;
};

const AnnouncementModule = (props: {
    lang: Lang;
    module: HomePageShortcutModuleViewModel;
}) =>
{
    return (
        <article className="spec1821-module-card">
            <ModuleHeader module={props.module} />
            <ul className="spec1821-module-list">
                {props.module.announcementList.map((item) => (
                    <AnnouncementItem
                        key={item.Announcement?.InternalId ?? item.Announcement?.AnnouncementId}
                        lang={props.lang}
                        item={item}
                        moreViewLink={props.module.setting.MoreViewLink}
                    />
                ))}
            </ul>
            <MoreLink lang={props.lang} to={props.module.setting.MoreViewLink} />
        </article>
    );
};

const FileArchiveModule = (props: {
    lang: Lang;
    module: HomePageShortcutModuleViewModel;
}) =>
{
    return (
        <article className="spec1821-module-card">
            <ModuleHeader module={props.module} />
            <ul className="spec1821-module-list">
                {props.module.fileArchiveList.map((item) => (
                    <FileArchiveItem
                        key={item.FileArchive?.InternalId ?? item.FileArchive?.FileArchiveId}
                        lang={props.lang}
                        item={item}
                        moreViewLink={props.module.setting.MoreViewLink}
                    />
                ))}
            </ul>
            <MoreLink lang={props.lang} to={props.module.setting.MoreViewLink} />
        </article>
    );
};

const ModuleHeader = (props: { module: HomePageShortcutModuleViewModel; }) =>
{
    return (
        <header className="spec1821-module-card__header">
            <h3>{props.module.setting.Title}</h3>
            {props.module.setting.SubTitle && <span>{props.module.setting.SubTitle}</span>}
        </header>
    );
};

const AnnouncementItem = (props: {
    lang: Lang;
    item: AnnouncementSet;
    moreViewLink?: string | null;
}) =>
{
    const detail = props.item.AnnouncementDetail?.find((item) => item.Lang === props.lang)
        ?? props.item.AnnouncementDetail?.[0];
    const title = detail?.Title ?? "";
    const link = buildDetailLink(
        props.moreViewLink,
        props.item.Announcement?.InternalId,
    );

    return (
        <li className="spec1821-module-list__item">
            <LangLink to={link} lang={props.lang} title={title}>
                <span className="spec1821-module-list__title">{title}</span>
                <time>{formatDate(props.item.Announcement?.Validate_Start)}</time>
            </LangLink>
        </li>
    );
};

const FileArchiveItem = (props: {
    lang: Lang;
    item: FileArchiveSet;
    moreViewLink?: string | null;
}) =>
{
    const info = props.item.FileArchiveInfo?.find((item) => item.Lang === props.lang)
        ?? props.item.FileArchiveInfo?.[0];
    const title = info?.Title ?? "";
    const download = useMemo(
        () => getFirstFileArchiveDownload(props.item, props.lang),
        [props.item, props.lang],
    );
    const fallbackLink = buildDetailLink(
        props.moreViewLink,
        props.item.FileArchive?.InternalId,
    );
    const link = download.url || fallbackLink;

    return (
        <li className="spec1821-module-list__item">
            <LangLink
                to={link}
                lang={props.lang}
                title={download.title || title}
                target={download.target}
            >
                <span className="spec1821-module-list__title">{title}</span>
                {download.ext && <span className="spec1821-module-list__badge">{download.ext}</span>}
            </LangLink>
        </li>
    );
};

const MoreLink = (props: { lang: Lang; to?: string | null; }) =>
{
    if (!LibText.isNonEmptyString(props.to)) return null;
    return (
        <div className="spec1821-module-card__more">
            <LangLink
                to={props.to ?? ""}
                lang={props.lang}
                className="spec1821-more-link"
            >
                View More
            </LangLink>
        </div>
    );
};
// #endregion

// #region Private
const getSafeIndex = (index: number, total: number) =>
{
    if (total <= 0) return 0;
    return Math.min(Math.max(index, 0), total - 1);
};

const getTabId = (item: SpecHomePage1821Shortcut, index: number) =>
{
    return `spec1821-shortcut-tab-${item.RowId ?? index}`;
};

const buildDetailLink = (
    moreViewLink?: string | null,
    internalId?: string | null,
) =>
{
    const base = String(moreViewLink ?? "").trim();
    const id = String(internalId ?? "").trim();
    if (!base || !id) return base || "#";
    if (/^https?:\/\//i.test(base)) return base;
    return `${base.replace(/\/$/, "")}/${encodeURIComponent(id)}`;
};

const getFirstFileArchiveDownload = (item: FileArchiveSet, lang: Lang) =>
{
    const infoRowId = item.FileArchiveInfo?.find(
        (info) => info.Lang === lang,
    )?.RowId;
    const file = item.FileArchiveDetail?.find((row) => row.ParentRowId === infoRowId)
        ?? item.FileArchiveDetail?.[0];
    if (file?.FileSrcId)
    {
        const ext = file.FileSrc?.FileExtension ?? "file";
        const fileName = file.FileName ?? "";
        const url = ext.toLowerCase() === "pdf"
            ? FileManagementAPI.get_Public_Preview_Url(file.FileSrcId, fileName)
            : FileManagementAPI.get_Public_Download_Url(file.FileSrcId, fileName);
        return { url, title: fileName, ext, target: "_blank" };
    }

    const urlRow = item.FileArchiveUrlDetail?.find((row) => row.ParentRowId === infoRowId)
        ?? item.FileArchiveUrlDetail?.[0];
    if (urlRow?.Url)
    {
        return {
            url: urlRow.Url,
            title: urlRow.UrlDescription ?? "",
            ext: "link",
            target: urlRow.WindowTarget === 1 ? "_blank" : undefined,
        };
    }

    return { url: "", title: "", ext: "", target: undefined };
};
// #endregion
