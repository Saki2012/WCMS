import { PersonAdapter } from "@/Features/Hooks/BizFunc/COMM/Person_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDateTime, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PersonModelFields, PGID } from "@/types/SchemaFields";
import { createElement, useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type PersonSet = components["schemas"]["PersonSet_DTO"];

type PersonApiAdapter = ReturnType<typeof PersonAdapter>;

type PersonCudActions = ReturnType<PersonApiAdapter["hooks"]["useCudActions"]>;

export interface PersonListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface PersonSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 姓名搜尋關鍵字 */
    personName?: string;

    /** Email 搜尋關鍵字 */
    email?: string;
}

export interface PersonListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 人員列表資料 */
    list: PersonSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface PersonListAdapter
{
    /** 人員 API adapter */
    Person: PersonApiAdapter;

    /** 人員 CUD 操作 */
    cudActions: PersonCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type PersonListGridTemplate = ServerListGridTemplate<PersonSearchParams, PersonListRawData, PersonListAdapter, QueryListParam, PersonListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: PersonCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const PERSON_NAME_SEARCH_KEY = "personName";

export const PERSON_EMAIL_SEARCH_KEY = "email";


const PERSON_LIST_STATE_KEY = "server-person-list";

const DEFAULT_PERSON_LIST_PAGE_STATE: PersonListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立人員後台 ListGridTemplate 設定 */
export const usePersonListGridTemplate = (opt: { lang: Lang; }): PersonListGridTemplate =>
{
    const pageState = usePageStateMemory<PersonListPageState>({
        stateKey: PERSON_LIST_STATE_KEY,
        defaultState: DEFAULT_PERSON_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<PersonListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Person,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updatePersonSearchValues,
                updatePageNumber: updatePersonPageNumber,
                getPagination: getPersonPagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildPersonSearchFields(rawData),
                toSearchParams: (values) => toPersonSearchParams(values, opt.lang),
                buildSearchConditions: buildPersonSearchConditions,
                buildQueryParam: buildPersonQueryParam,
                useDataSource: usePersonListGridDataSource,
                buildGridProps: (ctx) => buildPersonGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新Person記憶狀態，並固定回到第一頁。 */
const updatePersonSearchValues = (state: PersonListPageState, searchValues: SearchValues): PersonListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新Person列表記憶頁碼。 */
const updatePersonPageNumber = (state: PersonListPageState, pageNumber: number): PersonListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的Person分頁資訊。 */
const getPersonPagination = (rawData: PersonListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行人員列表資料來源 Hook */
const usePersonListGridDataSource = (
    ctx: ServerListGridDataSourceContext<PersonSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<PersonListRawData, PersonListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() => ({ Person: PersonAdapter() }), []);
    const cudActions = apiAdapter.Person.hooks.useCudActions({ onError });
    const grid = apiAdapter.Person.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const rawData = useMemo<PersonListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading: grid.isLoading, errors: grid.errors ?? [], refetchData };
};

/** 建立人員搜尋欄位設定 */
const buildPersonSearchFields = (rawData: PersonListRawData): SearchFieldConfig[] =>
{
    const nameTitle = getColumnTitle(rawData.modelDisplayName, PersonModelFields.PersonName, "姓名");
    const emailTitle = getColumnTitle(rawData.modelDisplayName, PersonModelFields.Email, "Email");

    return [
        { key: PERSON_NAME_SEARCH_KEY, title: nameTitle, type: "text", placeholder: `請輸入${nameTitle}` },
        { key: PERSON_EMAIL_SEARCH_KEY, title: emailTitle, type: "text", placeholder: `請輸入${emailTitle}` },
    ];
};

/** 將 SearchValues 轉為人員列表查詢參數 */
const toPersonSearchParams = (values: SearchValues, lang: Lang): PersonSearchParams =>
{
    return {
        lang,
        personName: getSearchStringValue(values[PERSON_NAME_SEARCH_KEY]),
        email: getSearchStringValue(values[PERSON_EMAIL_SEARCH_KEY]),
    };
};

/** 建立人員搜尋條件 */
const buildPersonSearchConditions = (ctx: { searchParams: PersonSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.personName)
    {
        conditions.push(`${PersonModelFields.PersonName} Like ${ctx.searchParams.personName}`);
    }

    if (ctx.searchParams.email)
    {
        conditions.push(`${PersonModelFields.Email} Like ${ctx.searchParams.email}`);
    }

    return conditions;
};

/** 建立人員列表完整 QueryParam */
const buildPersonQueryParam = (ctx: { pageNumber: number; searchParams: PersonSearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildPersonQueryFields();
    const condition = LibCondition.joinConditions([ctx.searchCondition]);
    return { Fields: fields, Condition: condition, OrderBy: [{ Col: PersonModelFields.CreateTime, Desc: true }], PageNumber: ctx.pageNumber, PageSize: 10 };
};

/** 建立人員列表查詢欄位 */
const buildPersonQueryFields = (): string[] =>
{
    return [
        PersonModelFields.InternalId,
        PersonModelFields.PersonId,
        PersonModelFields.PersonName,
        PersonModelFields.PersonImgId,
        PersonModelFields.Email,
        PersonModelFields.MobilePhone,
        PersonModelFields.ModifyTime,
        PersonModelFields.CreateTime,
    ];
};

/** 將人員資料轉為 GridProps */
const buildPersonGridProps = (
    opt: {
        raw: PersonListRawData;
        lang: Lang;
        adapter?: PersonListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [PersonModelFields.PersonImgId, PersonModelFields.PersonId, PersonModelFields.PersonName, PersonModelFields.Email, PersonModelFields.MobilePhone, PersonModelFields.ModifyTime];
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName, { buildFallback: getPersonColumnFallback });
    const rows = buildPersonRows(opt.raw, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhancePersonGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入人員 Grid 編輯與刪除動作 */
const enhancePersonGrid = (
    opt: {
        baseGrid: GridProps;
        raw: PersonListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<PersonSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    return enhanceGridWithAdjustCell(opt.baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.Person?.InternalId ?? "",
    });
};

/** 建立人員列表列資料 */
const buildPersonRows = (raw: PersonListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildPersonRow(set, columns));
};

/** 建立人員列表單列資料 */
const buildPersonRow = (set: PersonSet, columns: ColumnConfig[]): GridRow =>
{
    const person = set.Person;
    const keyId = person?.InternalId ?? LibText.Merge("|", false, person?.PersonId, person?.Email);
    const cells: RowCell[] = [
        { col: columns[0], content: buildPersonImage(set) },
        { col: columns[1], content: person?.PersonId ?? "" },
        { col: columns[2], content: person?.PersonName ?? "" },
        { col: columns[3], content: person?.Email ?? "" },
        { col: columns[4], content: person?.MobilePhone ?? "" },
        { col: columns[5], content: formatDateTime(person?.ModifyTime) },
    ];

    return { keyId, cells };
};

/** 建立人員圖片預覽 */
const buildPersonImage = (set: PersonSet): RowCell["content"] =>
{
    const personImgId = set.Person?.PersonImgId;
    if (!personImgId) return null;

    return createElement("img", {
        src: FileManagementAPI.get_Server_Preview_Url(personImgId),
        alt: "人員圖片預覽",
        style: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "50%" },
    });
};

/** 取得人員列表欄位預設顯示文字 */
const getPersonColumnFallback = (columnId: string): string =>
{
    const map: Record<string, string> = {
        [PersonModelFields.PersonImgId]: "圖片",
        [PersonModelFields.PersonId]: "人員代號",
        [PersonModelFields.PersonName]: "姓名",
        [PersonModelFields.Email]: "Email",
        [PersonModelFields.MobilePhone]: "手機",
        [PersonModelFields.ModifyTime]: "修改時間",
    };

    return map[columnId] ?? `【${columnId}】`;
};

// #endregion
