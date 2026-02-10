import { LibCheckBox, LibTextBox, LibTextArea, LibFile, LibDropList, LibPicture } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { components } from "@/types/api";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { PGID, WebResourceFields, WebResourceInfoFields, WebResourceSetFields } from "@/types/SchemaFields";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";

type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type CategorySet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]

const emptyData: WebResourceSet = { WebResource: {}, WebResourceInfo: [] }
/** 網路資源表單
 * @returns 
 */
export const WebResourceFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const navigate = useNavigate();

    const adapter = useMemo(() => WebResourceAdapter(), []);
    const formData = useWebResourceFormDataByAdapter(adapter, internalId ?? "", emptyData)

    const useCategory = useCategoryMapByProgId(PGID.WebResource, prop.lang);
    const useTag = useTagMapByProgId(PGID.WebResource, prop.lang);

    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const status = useMemo(() => { const src = useContentStatus.data ?? {}; const { ["0"]: _drop, ...rest } = src; return rest as Record<string, string>; }, [useContentStatus.data]);
    const windowTarget = useFetchEnumOptions("WindowTarget")

    const actions = useWebResourceFormActionsFromAdapter(
        adapter,
        internalId ?? "",
        formData.data as WebResourceSet,
        () => navigate(dirUrl.replace(/\/Form$/, "/List")),
    )

    useEnsureLangDetails(formData, { headerName: WebResourceSetFields.WebResource, detailName: WebResourceSetFields.WebResourceInfo, parentKeys: [WebResourceFields.WebResourceId], preferFirstLang: prop.lang });
    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading, windowTarget.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error, windowTarget.error]
    const formProp: FormCompProp = { Title: "新增網路資源", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.opts} statusOpts={status} tagOpts={useTag.opts} />
            <DetailComp theme={prop.theme} formData={formData} urlOpenOpt={windowTarget.data} />
        </FormComp>
    )
}

const useWebResourceFormDataByAdapter = (
    adapter: ReturnType<typeof WebResourceAdapter>,
    internalId: string,
    empty: WebResourceSet,
): UseFetchFormDataResult<WebResourceSet> => {
    // 宣告變數
    const { publish } = useToast();
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function：toast 錯誤
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const initial = useMemo<ApiLoaderData<string, WebResourceSet> | null>(() => {
        // 執行 function：新建模式提供 initial data
        if (!isNew) return null;
        const ok: ApiResponse<WebResourceSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        return { args: internalKey, apiRes: ok };
    }, [isNew, empty, internalKey]);

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });

    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    const [data, setData] = useState<WebResourceSet>(empty);

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

    // return
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

const useWebResourceFormActionsFromAdapter = (
    adapter: ReturnType<typeof WebResourceAdapter>,
    internalId: string,
    formData: WebResourceSet,
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
        Preview: () => { /* WebResource 無 Preview */ },
        IsSaving: actions.isSaving,
    };
};

const useCategoryMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const adapter = useMemo(() => CategoryAdapter(), []);
    const query = adapter.hooks.useMapByProgId({
        progId,
        lang,
        pageSize: 0,
        deps: [progId, lang],
    });

    // return（opts = query.map）
    return {
        opts: (query.map ?? {}) as Record<string, string>,
        rawData: (query.data ?? []) as CategorySet[],
        isLoading: Boolean(query.isLoading),
        error: query.errorText ?? null,
    };
};

const useTagMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const adapter = useMemo(() => TagAdapter(), []);
    const query = adapter.hooks.useMapByProgId({
        progId,
        lang,
        pageSize: 0,
        deps: [progId, lang],
    });

    // return（opts = query.map）
    return {
        opts: (query.map ?? {}) as Record<string, string>,
        rawData: (query.data ?? []) as TagSet[],
        isLoading: Boolean(query.isLoading),
        error: query.errorText ?? null,
    };
};

const HeaderComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<WebResourceSet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<WebResourceSet>(prop.formData);
    const useUploadPic = useUploadPicture();
    const initialPicId = prop.formData.data?.WebResource?.PicId;
    const previewSrc = useUploadPic.result.previewUrl || (initialPicId ? `${FileManagementAPI.PREVIEW_URL}/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");
    const LibTabsPropA: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Img": "圖片", }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(WebResourceSetFields.WebResource, WebResourceFields.Categories, 'string', undefined, 'csv')} />,
        ],
        Status: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(WebResourceSetFields.WebResource, WebResourceFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />
        ],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(WebResourceSetFields.WebResource, WebResourceFields.Tags, 'string', undefined, 'csv')} />],
        Img: [
            <LibFile Style={prop.theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}
                InputValue={""}
                accept="image/*"
                parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                onChange={(files) =>
                    useUploadPic.handleFileChange(files, (internalId) => {
                        prop.formData.setFormData((prev) => ({ ...prev, WebResource: { ...prev?.WebResource, PicId: internalId, }, }));
                    })
                }>
                <LibPicture key="preview" ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""} PicSrc={previewSrc} PicDescription={`選中的圖片`} />
            </LibFile>,
            <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResource, WebResourceFields.PicDescription, "string")} />,
        ]
    }

    return <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>
}

const DetailComp = (prop: { theme: IBETheme, formData: UseFetchFormDataResult<WebResourceSet>; urlOpenOpt: Record<string, string>; }) => {
    const setField = useSetTableField<WebResourceSet>(prop.formData);
    const rawDetails = prop.formData.data?.WebResourceInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.WebResourceId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.WebResourceId, info.RowId, info.Lang)
            const rowKeys = { [WebResourceInfoFields.WebResourceId]: info.WebResourceId, [WebResourceInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Title, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Content, "string", rowKeys)} />,
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.ResUrl, "string", rowKeys)} />,
                <LibDropList Style={prop.theme.DropList} Options={prop.urlOpenOpt} {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Url_OpenType, "number", rowKeys)} />,
            ]
            return compMap;
        }, {}
    );

    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)

}
