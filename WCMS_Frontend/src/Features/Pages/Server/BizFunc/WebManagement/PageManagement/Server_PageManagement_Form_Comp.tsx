import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { components } from "@/types/api";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { LibDropList, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";

import * as SchemaFields from "@/types/SchemaFields";
import { PGID } from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";

import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";

import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
// ⚠️ 這個 export 名稱請依你專案實際命名：若你是 export default，請改成對應的 Adapter export
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];

const emptyData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };

/** 後台頁面管理 Form */
export const PageFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const adapter = useMemo(() => PageManagementAdapter(), []);
    const formData = usePageManagementFormDataByAdapter(adapter, internalId ?? "", emptyData);

    const category = useCategoryMapByProgId(PGID.PageManagement, prop.lang);

    useEnsureLangDetails(formData, {
        headerName: SchemaFields.PageManagementSetFields.PageManagement,
        detailName: SchemaFields.PageManagementSetFields.PageManagementDetail,
        parentKeys: [SchemaFields.PageManagementDetailFields.PageId],
        preferFirstLang: prop.lang,
    });

    const onBackToList = useCallback(() => {
        // 執行 function：回列表
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const actions = usePageManagementFormActionsFromAdapter(adapter, internalId ?? "", formData.data, onBackToList);

    const isLoading = [category.isLoading, formData.isLoading];
    const errors = [category.error, formData.error];

    const formProp: FormCompProp = {
        Title: internalId ? "修改頁面" : "新增頁面",
        Theme: prop.theme,
        LoadingList: isLoading,
        ErrorList: errors,
        Actions: actions,
    };

    // return（⚠️ 不動 DOM 結構）
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} catData={category.opts} />
            <DetailComp theme={prop.theme} formData={formData} lang={prop.lang} />
        </FormComp>
    );
};

/** FormData：QueryData + ModelDisplayName（對標 Announcement） */
const usePageManagementFormDataByAdapter = (
    adapter: ReturnType<typeof PageManagementAdapter>,
    internalId: string,
    empty: PageManagementSet,
): UseFetchFormDataResult<PageManagementSet> => {
    // 宣告變數
    const { publish } = useToast();

    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const initial = useMemo<ApiLoaderData<string, PageManagementSet> | null>(() => {
        if (!isNew) return null;

        const ok: ApiResponse<PageManagementSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        return { args: internalKey, apiRes: ok };
    }, [isNew, empty, internalKey]);

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });

    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    const [data, setData] = useState<PageManagementSet>(empty);

    useEffect(() => {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() => {
        // 執行 function
        void query.refetch();
    }, [query]);

    const isLoading = Boolean(!isNew && query.isLoading) || Boolean(model.isLoading);
    const error = query.errorText ?? model.errorText ?? null;

    // return（displayName 不可為 null）
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

/** Actions：改用 adapter.useServerActions（對標 Announcement） */
const usePageManagementFormActionsFromAdapter = (
    adapter: ReturnType<typeof PageManagementAdapter>,
    internalId: string,
    formData: PageManagementSet,
    onBackToList: () => void,
): ServerFormActions => {
    // 宣告變數
    const isNew = useMemo(() => !internalId, [internalId]);

    const actions = adapter.useServerActions({
        onSuccessByMode: {
            create: () => onBackToList(),
            update: () => onBackToList(),
            delete: () => onBackToList(),
        },
    });

    // return
    return {
        Save: async () => {
            if (isNew) await actions.createAsync(formData);
            else await actions.updateAsync(internalId, formData);
        },
        Delete: async () => {
            if (!internalId) return;
            await actions.deleteAsync(internalId);
        },
        Back: onBackToList,
        Preview: () => { /* PageManagement 目前未提供 Preview */ },
        IsSaving: actions.isSaving,
    };
};

/** Category：useMapByProgId（opts = query.map） */
const useCategoryMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const adapter = useMemo(() => CategoryAdapter(), []);
    const query = adapter.hooks.useMapByProgId({
        progId,
        lang,
        pageSize: 0,
        deps: [progId, lang],
    });

    const error = useMemo(() => {
        // return
        return query.errorText ?? null;
    }, [query.errorText]);

    // return（⚠️ opts 用 query.map；rawData 若未來要做 format 才用）
    return {
        opts: (query.map ?? {}) as Record<string, string>,
        rawData: (query.data ?? []) as CategorySet[],
        isLoading: Boolean(query.isLoading),
        error,
    };
};

const HeaderComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<PageManagementSet>; catData: Record<string, string> }) => {
    const setField = useSetTableField<PageManagementSet>(prop.formData);
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本" } };
    const components: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibDropList Style={prop.theme.DropList} Options={prop.catData} {...setField(SchemaFields.PageManagementSetFields.PageManagement, SchemaFields.PageManagementFields.CategoryId, "string")} />,
        ],
    };
    return (<TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>);
};

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<PageManagementSet>; lang: Lang }) => {
    const setField = useSetTableField<PageManagementSet>(prop.formData);
    const rawDetails = prop.formData.data?.PageManagementDetail ?? [];

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.PageId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };

    const components: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.PageId, info.RowId, info.Lang);
            const rowKeys = {
                [SchemaFields.PageManagementDetailFields.PageId]: info.PageId,
                [SchemaFields.PageManagementDetailFields.RowId]: info.RowId,
            };

            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.PageManagementSetFields.PageManagementDetail, SchemaFields.PageManagementDetailFields.Title, "string", rowKeys)} />,
                <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(SchemaFields.PageManagementSetFields.PageManagementDetail, SchemaFields.PageManagementDetailFields.Content, "string", rowKeys)} />,
            ];
            return compMap;
        },
        {} as Record<string, React.ReactNode[]>
    );

    return (<TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>);
};
