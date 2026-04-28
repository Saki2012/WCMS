import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SpecJournalAuthorFields, SpecJournalModelFields } from "@/types/SchemaFields";
import { type ReactNode, useMemo, useState } from "react";
import { useId } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import type { SpecJournalMode } from "./Server_SpecJournal_Form_Hook";
import { type SpecJournalListRawData, useSpecJournalListFetchData } from "./Server_SpecJournal_List_Hooks";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type SpecJournalVolumeSearchFieldProps = {
    showVolume: boolean;
    volumeValue: string;
    authorValue: string;
    onVolumeChange: (value: string) => void;
    onAuthorChange: (value: string) => void;
};

const SpecJournalVolumeSearchField = (prop: SpecJournalVolumeSearchFieldProps) =>
{
    const id = useId();
    const handleVolumeChange = (value: string): void =>
    {
        const numericValue = value.replace(/\D/g, "");
        prop.onVolumeChange(numericValue);
    };
    const handleAuthorChange = (value: string): void =>
    {
        prop.onAuthorChange(value);
    };
    return (
        <>
            {prop.showVolume && (
                <div className="col-12 px-0 mt-4 row mx-0">
                    <label htmlFor={`${id}-volume`} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">卷數</label>
                    <div className="col-md-4 col-sm-12 float-md-left float-sm-none">
                        <input
                            id={`${id}-volume`}
                            type="text"
                            className="form-control"
                            placeholder="請輸入卷數"
                            value={prop.volumeValue}
                            onChange={(e) =>
                            {
                                handleVolumeChange(e.target.value);
                            }}
                            inputMode="numeric"
                            pattern="[0-9]*"
                        />
                    </div>
                </div>
            )}

            <div className="col-12 px-0 mt-4 row mx-0">
                <label htmlFor={`${id}-author`} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">作者</label>
                <div className="col-md-4 col-sm-12 float-md-left float-sm-none">
                    <input
                        id={`${id}-author`}
                        type="text"
                        className="form-control"
                        placeholder="請輸入作者名稱..."
                        value={prop.authorValue}
                        onChange={(e) =>
                        {
                            handleAuthorChange(e.target.value);
                        }}
                        inputMode="text"
                    />
                </div>
            </div>
        </>
    );
};

/** 後台期刊列表 */
export const Server_SpecJournal_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; mode: SpecJournalMode; }) =>
{
    const [kw, setKw] = useState<string>("");
    const [volume, setVolume] = useState<string>("");
    const [volumeInput, setVolumeInput] = useState<string>("");

    const [author, setAuthor] = useState<string>("");
    const [authorInput, setAuthorInput] = useState<string>("");

    const handleSubmitSearch = (nextKw: string): void =>
    {
        setKw(nextKw);
        setVolume(volumeInput);
        setAuthor(authorInput);
    };
    const handleResetSearch = (): void =>
    {
        setKw("");
        setVolume("");
        setVolumeInput("");
        setAuthor("");
        setAuthorInput("");
    };
    const searchCompProp: SearchBarProps = {
        title: "搜尋",
        subTitle: "搜尋 ...",
        onSubmit: handleSubmitSearch,
        onReset: handleResetSearch,
        extraFields: (
            <SpecJournalVolumeSearchField
                showVolume={prop.mode === "journal"}
                volumeValue={volumeInput}
                authorValue={authorInput}
                onVolumeChange={setVolumeInput}
                onAuthorChange={setAuthorInput}
            />
        ),
    };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);
    const getData = useSpecJournalListFetchData({ lang: prop.lang, kw, volume, author, mode: prop.mode });
    const navigate = useNavigate();
    const cudActions = getData.adapter.SpecJournal.hooks.useCudActions();
    const gridData = useMemo(() =>
    {
        return buildSpecJournalGridProps({
            raw: getData.rawData,
            lang: prop.lang,
            mode: prop.mode,
            crud: { navigate, dirUrl, deleteAsync: cudActions.deleteAsync, afterDelete: getData.refetchData },
        });
    }, [getData.rawData, prop.lang, prop.mode, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            GridData={gridData}
            SearchBar={searchCompProp}
        />
    );
};

// #region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<SpecJournalSet>>;
    afterDelete: () => Promise<void>;
};

/** SpecJournal 專用：rawData → GridProps */
const buildSpecJournalGridProps = (
    opt: {
        raw: SpecJournalListRawData;
        lang: Lang;
        mode: SpecJournalMode;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const columns = buildColumns(opt.raw, opt.mode);
    const rows = buildSpecJournalRows(opt.raw, columns, opt.mode);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    const actions = createGridCrudActions<SpecJournalSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.SpecJournal?.InternalId ?? "",
    });
};
/** 建立欄位清單 */
const buildColumns = (raw: SpecJournalListRawData, mode: SpecJournalMode): ColumnConfig[] =>
{
    const base: ColumnConfig[] = [
        buildSchemaColumn(SpecJournalModelFields.Title, raw),
        buildSchemaColumn(SpecJournalAuthorFields.AuthorName, raw),
        buildSchemaColumn(SpecJournalModelFields.CreateTime, raw),
        buildSchemaColumn(SpecJournalModelFields.ModifyUserId, raw),
        buildSchemaColumn(SpecJournalModelFields.ModifyTime, raw),
    ];

    if (mode === "preprint") return base;
    return [{ key: "__volIssue__", title: "卷期" }, ...base];
};
/** 依 schema 找對應欄位標題 */
const buildSchemaColumn = (colId: string, raw: SpecJournalListRawData): ColumnConfig =>
{
    const tables = raw.modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === colId);
    return { key: colId, title: hit?.ColumnDisplayName ?? `【${colId}】` };
};

/** 建立 Grid rows */
const buildSpecJournalRows = (raw: SpecJournalListRawData, columns: ColumnConfig[], mode: SpecJournalMode): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibMerge("|", false, set.SpecJournal?.JournalId, set.SpecJournal?.InternalId);
        const cells: RowCell[] = [];
        let colIdx = 0;

        if (mode === "journal")
        {
            cells.push({ col: columns[colIdx++], content: renderVolIssue(set) });
        }

        cells.push({ col: columns[colIdx++], content: renderTitle(set) });
        cells.push({ col: columns[colIdx++], content: renderAuthorName(set) });
        cells.push({ col: columns[colIdx++], content: FormatDateTime(set.SpecJournal?.CreateTime) });
        cells.push({ col: columns[colIdx++], content: set.SpecJournal?.ModifyUser?.AccountName ?? "" });
        cells.push({ col: columns[colIdx++], content: FormatDateTime(set.SpecJournal?.ModifyTime) });

        return { keyId, cells };
    });
};

/** 顯示卷期文字 */
const renderVolIssue = (set: SpecJournalSet): string =>
{
    const detail = set.SpecJournal?._JournalIndexDetail;
    const volume = detail?.Volume ?? "";
    const issue = detail?.Issue ?? "";
    const hasValue = Boolean(volume) || Boolean(issue);
    return hasValue ? `${volume}卷${issue}期` : "";
};

/** 顯示中英文標題 */
const renderTitle = (set: SpecJournalSet): ReactNode =>
{
    const title = set.SpecJournal?.Title ?? "";
    const titleEn = set.SpecJournal?.Title_en ?? "";
    return (
        <>
            <p className="mb-0">{title}</p>
            <p className="mb-0">{titleEn}</p>
        </>
    );
};

/** 顯示中英文作者名稱 */
const renderAuthorName = (set: SpecJournalSet): ReactNode =>
{
    return (
        <ul className="m-0 p-0" style={{ listStylePosition: "inside" }}>
            {set.SpecJournalAuthor?.map((author, i) =>
            {
                const display = author.AuthorName && author.AuthorName_en
                    ? `${author.AuthorName} (${author.AuthorName_en})`
                    : author.AuthorName
                    ? author.AuthorName
                    : author.AuthorName_en;
                return <li key={`${author}-${i}`} className="m-0 p-0">{display}</li>;
            })}
        </ul>
    );
};

// #endregion
