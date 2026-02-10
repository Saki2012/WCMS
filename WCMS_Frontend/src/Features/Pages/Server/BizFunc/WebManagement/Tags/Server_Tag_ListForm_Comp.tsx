import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";

import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";

import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";

import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";

import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";

import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";

import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ModelDisplaySchema } from "@/types/IApiSchema";

import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";

type TagSet = components["schemas"]["TagSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

const buildEmptyTagSet = (progId: string): TagSet => ({
    TagData: { ProgId: progId },
    TagDetail: [],
});

/** Tag 清單 + 表單 */
export const TagListFormComp = (prop: { progId: string; title: string; theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const { internalId } = useParams();
    const { pathname } = useLocation();

    const adapter = useMemo(() => TagAdapter(), []);
    const emptyData = useMemo(() => buildEmptyTagSet(prop.progId), [prop.progId]);

    let dirUrl = pathname.replace(/\/Tag$/, `/Tag`);
    const pathParts = pathname.split("/");
    if (pathParts[pathParts.length - 1] !== "Tag") dirUrl = location.pathname.split("/").slice(0, -1).join("/");

    // 執行 function：列表 + 表單資料（改用 Adapter）
    const list = useTagListByAdapter(adapter, prop.progId, prop.lang);
    const formData = useTagFormDataByAdapter(adapter, internalId ?? "", emptyData);

    // 執行 function：Actions（改用 useServerActions）
    const actions = useTagActionsFromAdapter(dirUrl, adapter, internalId ?? "", formData, list.refetchFirst, prop.progId);

    // 執行 function：補齊語系明細列
    useEnsureLangDetails(formData, {
        headerName: SchemaFields.TagSetFields.TagData,
        detailName: SchemaFields.TagSetFields.TagDetail,
        parentKeys: [SchemaFields.TagDataFields.TagId],
        preferFirstLang: prop.lang,
    });

    const isLoading = [list.isLoading, formData.isLoading];
    const errors = [list.error, formData.error];

    const tagEditNode = useMemo(
        () => (formData.data ? (<TagEditComp theme={prop.theme} formData={formData} />) : null),
        [prop.theme, formData.data],
    );

    const tagListNode = useMemo(
        () => (list.rawData ? (<TagListComp theme={prop.theme} tagSets={list.rawData} lang={prop.lang} actions={actions} />) : null),
        [prop.theme, list.rawData, prop.lang, actions],
    );

    // return（不改 JSX / DOM 結構）
    return (
        <FormListComp Title={prop.title} SubTitle={prop.title} Theme={prop.theme}
            LoadingList={isLoading} ErrorList={errors}
            InputControl={tagEditNode} GridItems={tagListNode}
            Actions={actions}
        ></FormListComp>
    );
};

/** ✅ List：用 Adapter QueryList 取回 TagSet[] */
const useTagListByAdapter = (adapter: ReturnType<typeof TagAdapter>, progId: string, lang: Lang) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const condition = useMemo<QueryListParam>(() => {
        // 宣告變數
        const cond = progId ? `${SchemaFields.TagDataFields.ProgId} = ${progId}` : "";

        // return
        return {
            Fields: [
                SchemaFields.TagDataFields.InternalId,
                SchemaFields.TagDataFields.TagId,
                SchemaFields.TagDataFields.ProgId,
                SchemaFields.TagDataFields.CreateTime,
                SchemaFields.TagDataFields.ModifyTime,
                SchemaFields.TagDataFields.ModifyUserId,
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
            ],
            Condition: cond,
            OrderBy: [{ Col: SchemaFields.TagDataFields.CreateTime, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
        };
    }, [progId]);

    const query = adapter.hooks.useQueryList({
        condition,
        deps: [condition.Condition ?? "", lang],
        onError,
    });

    const refetchFirst = useCallback(async () => {
        // 執行 function
        await query.refetch();
    }, [query]);

    // return
    return {
        rawData: (query.data ?? []) as TagSet[],
        isLoading: Boolean(query.isLoading),
        error: query.errorText ?? null,
        refetchFirst,
    };
};

/** ✅ FormData：改用 Adapter QueryData + ModelDisplayName（對標 Category/Announcement Form） */
const useTagFormDataByAdapter = (
    adapter: ReturnType<typeof TagAdapter>,
    internalId: string,
    empty: TagSet,
): UseFetchFormDataResult<TagSet> => {
    // 宣告變數
    const { publish } = useToast();
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, TagSet> | null>(() => {
        // 執行 function：新建模式提供 initial data
        if (!isNew) return null;
        const ok: ApiResponse<TagSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        return { args: internalKey, apiRes: ok };
    }, [isNew, empty, internalKey]);

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    const [data, setData] = useState<TagSet>(empty);

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

/** ✅ Actions：用 adapter.useServerActions 但回傳 UseActionsResult（讓 FormListComp / Toolbar 不用改） */
const useTagActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof TagAdapter>,
    internalId: string,
    formData: UseFetchFormDataResult<TagSet>,
    refetchList: () => Promise<void>,
    progId: string,
): UseActionsResult => {
    // 宣告變數
    const navigate = useNavigate();
    const isNew = useMemo(() => !internalId, [internalId]);

    const server = adapter.useServerActions({
        // 成功後一律回列表並 refresh
        onSuccessByMode: {
            create: async () => {
                navigate(dirUrl);
                await refetchList();
                formData.setFormData(buildEmptyTagSet(progId));
            },
            update: async () => {
                navigate(dirUrl);
                await refetchList();
            },
            delete: async () => {
                navigate(dirUrl);
                await refetchList();
                formData.setFormData(buildEmptyTagSet(progId));
            },
        },
    });

    const onAddNew = useCallback(() => {
        // 執行 function
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onEdit = useCallback((id: string) => {
        // 執行 function
        navigate(`${dirUrl}/${id}`);
    }, [navigate, dirUrl]);

    const onCancelBack = useCallback(() => {
        // 執行 function
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onSave = useCallback(async () => {
        // 執行 function
        const dto = formData.data;
        if (!dto) return false;

        const res = isNew ? await server.createAsync(dto) : await server.updateAsync(internalId, dto);
        return Boolean(res.IsSuccess);
    }, [formData.data, isNew, server, internalId]);

    const onDelete = useCallback(async (id: string) => {
        // 宣告變數
        const ok = window.confirm("確定要刪除嗎？");
        if (!ok) return;

        // 執行 function
        await server.deleteAsync(id);
    }, [server]);

    // return（保持 UseActionsResult 介面，讓 GridCol_Toolbar 可用）
    return useMemo(() => ({
        isExecuting: server.isSaving,
        onSave,
        onDelete,
        onInvalid: () => { /* Tag 目前不做 invalid */ },
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () => { /* Tag 目前不做 preview */ },
    }), [server.isSaving, onSave, onDelete, onCancelBack, onAddNew, onEdit]);
};

const TagEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<TagSet>; }) => {
    const setField = useSetTableField<TagSet>(props.formData);
    const rawDetails = props.formData.data?.TagDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.TagId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.TagId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.TagDetailFields.TagId]: info.TagId, [SchemaFields.TagDetailFields.RowId]: info.RowId, }
            compMap[langKey] = [<LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.TagSetFields.TagDetail, SchemaFields.TagDetailFields.TagName, "string", rowKeys)} />,]
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}

const TagListComp = (prop: { theme: IBETheme; tagSets: TagSet[]; lang: Lang; actions: UseActionsResult }) => {
    const basePath = useLocation().pathname.split('/Tag')[0];
    const dirPath = `${basePath}/Tag`;
    return (
        <ul className="list-group p-0">
            {prop.tagSets.map((item) => {
                const internalId = item.TagData?.InternalId ?? "";
                return (
                    <li className="list-group-item" key={`${item.TagData?.InternalId}-${item.TagDetail?.find(p => p.Lang === prop.lang)?.RowId}`}>
                        <div className="checkboxDIV my-2">
                            <div className="custom-control form-check">
                                <LangLink to={`${dirPath}/${item.TagData?.InternalId}`} className="form-check-label" aria-label={`前往 ${item.TagDetail?.find(p => p.Lang === prop.lang)?.TagName} 詳細頁`}>
                                    <span className="check-txt">{item.TagDetail?.find(p => p.Lang === prop.lang)?.TagName}</span>
                                </LangLink>
                            </div>
                        </div>
                        <div className="form-check form-switch my-2">
                            <GridCol_Toolbar key={internalId} action={prop.actions} internalId={internalId} />
                        </div>
                    </li>)
            }
            )}
        </ul>
    )
}
