import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import type { components } from "@/types/api";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";

import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import LibCheckBox from "@/SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import LibCalendar from "@/SysCore/Components/FormField/FieldComponets/LibCalendar_Comp";

import { LibTextBox, LibTinyMCE, LibFile, LibPicture, LibFileInput } from "@/SysCore/Components/FormField/LibFormField";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";

import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";

import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { PreviewFrame } from "@/Features/Pages/Server/Scaffold/PreviewFrame/PreviewFrame";

import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";

import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";

import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";

import { AnnouncementDetailFields, AnnouncementDetailFileFields, AnnouncementFields, AnnouncementSetFields, PGID, } from "@/types/SchemaFields";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

type PreviewPayload = | { type: "wcms:preview"; module: "announcement"; payload: { kind: "dto"; dto: AnnouncementSet } };

const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [], AnnouncementDetailFile: [] };

/** 後台公告 Form */
export const Server_AnnouncementFormComp = (props: { theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const adapter = useMemo(() => AnnouncementAdapter(), []);
    const formData = useAnnouncementFormDataByAdapter(adapter, internalId ?? "", emptyData);

    // Category/Tag
    const category = useCategoryMapByProgId(PGID.Announcement, props.lang);
    const tag = useTagMapByProgId(PGID.Announcement, props.lang);

    const useContentStatus = useFetchEnumOptions("ContentStatus");

    const status = useMemo(() => {
        // 宣告變數
        const src = useContentStatus.data ?? {};
        const { ["0"]: _drop, ...rest } = src;

        // return
        return rest as Record<string, string>;
    }, [useContentStatus.data]);

    // Preview
    const [open, setOpen] = useState(false);
    const [payload, setPayload] = useState<PreviewPayload | undefined>(undefined);

    const handlePreviewFromDto = useCallback((dto: AnnouncementSet) => {
        // 執行 function
        setPayload({
            type: "wcms:preview",
            module: "announcement",
            payload: { kind: "dto", dto },
        });
        setOpen(true);
    }, []);

    const onBackToList = useCallback(() => {
        // 執行 function：回列表
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const actions = useAnnouncementFormActionsFromAdapter(
        adapter,
        internalId ?? "",
        formData.data,
        onBackToList,
        () => handlePreviewFromDto(formData.data),
    );

    useEnsureLangDetails(formData, {
        headerName: AnnouncementSetFields.Announcement,
        detailName: AnnouncementSetFields.AnnouncementDetail,
        parentKeys: [AnnouncementDetailFields.AnnouncementId],
        preferFirstLang: props.lang,
    });

    const isLoading = [category.isLoading, tag.isLoading, formData.isLoading, useContentStatus.isLoading];
    const errors = [category.error, tag.error, formData.error, useContentStatus.error];

    const propForm: FormCompProp = {
        Title: internalId ? "修改公告" : "新增公告",
        Theme: props.theme,
        LoadingList: isLoading,
        ErrorList: errors,
        Actions: actions,
    };

    // return（不動 div/DOM 結構）
    return (
        <FormComp prop={propForm}>
            <HeaderComp
                theme={props.theme}
                formData={formData}
                cateOpts={category.data}
                statusOpts={status}
                tagOpts={tag.data}
            />
            <DetailComp theme={props.theme} formData={formData} />
            <PreviewFrame open={open} siteIndex={""} onClose={() => setOpen(false)} payload={payload} title="預覽" />
        </FormComp>
    );
};

/** FormData：QueryData + ModelDisplayName */
const useAnnouncementFormDataByAdapter = (adapter: ReturnType<typeof AnnouncementAdapter>, internalId: string, empty: AnnouncementSet,)
    : UseFetchFormDataResult<AnnouncementSet> => {
    // 宣告變數
    const { publish } = useToast();

    const internalKey = internalId || "__new__";

    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, AnnouncementSet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<AnnouncementSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
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

    const [data, setData] = useState<AnnouncementSet>(empty);

    useEffect(() => {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() => {
        // 執行 function
        void query.refetch();
    }, [query]);

    const isLoading = (Boolean(!isNew && query.isLoading) || Boolean(model.isLoading));
    const error = query.errorText ?? model.errorText ?? null;

    // return（displayName 不可為 null）
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [], } as ModelDisplaySchema)),
    };
};

/** Actions：改用 Adapter.useServerActions（回傳 ServerFormActions 給 FormComp） */
const useAnnouncementFormActionsFromAdapter = (
    adapter: ReturnType<typeof AnnouncementAdapter>,
    internalId: string,
    formData: AnnouncementSet,
    onBackToList: () => void,
    onPreview: () => void,
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

    // return（不動 UI 結構）
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
        Preview: onPreview,
        IsSaving: actions.isSaving,
    };
};

const HeaderComp = (prop: {
    theme: IBETheme;
    formData: UseFetchFormDataResult<AnnouncementSet>;
    cateOpts: Record<string, string>;
    statusOpts: Record<string, string>;
    tagOpts: Record<string, string>;
}) => {
    // 宣告變數
    const setField = useSetTableField<AnnouncementSet>(prop.formData);
    const useUploadPic = useUploadPicture();

    const initialPicId = prop.formData.data?.Announcement?.PictureId;
    const previewSrc =
        useUploadPic.result.previewUrl ||
        (initialPicId ? `${FileManagementAPI.PREVIEW_URL}/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: { Basic: "基本", Status: "狀態", Tags: "標籤", Pic: "圖片" },
    };

    const tabContent: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.cateOpts}
                {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Categories, "string", undefined, "csv")}
            />,
            <LibCalendar {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start, "datetime")} />,
            <LibCalendar {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_End, "datetime")} />,
        ],
        Status: [
            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.statusOpts}
                {...setField(
                    AnnouncementSetFields.Announcement,
                    AnnouncementFields.ContentStatus,
                    "number",
                    undefined,
                    { strategy: "sum", sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) },
                )}
            />,
        ],
        Tags: [
            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.tagOpts}
                {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Tags, "string", undefined, "csv")}
            />,
        ],
        Pic: [
            <LibFile
                Style={prop.theme.File}
                ColumnDisplayName="選擇圖片"
                Multiple={false}
                InputValue=""
                accept="image/*"
                parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                onChange={(files) =>
                    useUploadPic.handleFileChange(files, (fileId) => {
                        prop.formData.setFormData(prev => ({
                            ...prev,
                            Announcement: { ...prev.Announcement, PictureId: fileId },
                        }));
                    })
                }
            >
                <LibPicture
                    key="preview"
                    ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""}
                    PicSrc={previewSrc}
                    PicDescription="選中的圖片"
                />
            </LibFile>,
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.PicDescription, "string")}
            />,
        ],
    };

    // return（不動 div/DOM 結構）
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    );
};

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<AnnouncementSet> }) => {
    // 宣告變數
    const setField = useSetTableField<AnnouncementSet>(prop.formData);
    const rawDetails = prop.formData.data?.AnnouncementDetail ?? [];

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.AnnouncementId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };

    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info, idx) => {
            const detailRowId = info.RowId ?? idx;
            const langKey = LibMerge("_", true, info.AnnouncementId, info.RowId, info.Lang);
            const rowKeys = {
                [AnnouncementDetailFields.AnnouncementId]: info.AnnouncementId,
                [AnnouncementDetailFields.RowId]: info.RowId,
            };

            compMap[langKey] = [
                <LibTextBox
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Title, "string", rowKeys)}
                />,
                <LibTextBox
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.SubTitle, "string", rowKeys)}
                />,
                <LibTinyMCE
                    Style={prop.theme.TinyMCE}
                    {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Content, "string", rowKeys)}
                />,
                <LibTextBox
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Url, "string", rowKeys)}
                />,
                <LibTextBox
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.UrlDescription, "string", rowKeys)}
                />,
                <SubDetailComp theme={prop.theme} formData={prop.formData} parentRowId={detailRowId}></SubDetailComp>,
            ];
            return compMap;
        },
        {},
    );

    // return（不動 div/DOM 結構）
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    );
};

const SubDetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<AnnouncementSet>; parentRowId: number }) => {
    // 宣告變數
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: AnnouncementDetailFile[] = props.formData.data?.AnnouncementDetailFile ?? [];

    const getFiles = (): AnnouncementDetailFile[] => {
        // return
        return allFiles
            .filter(f => f.ParentRowId === props.parentRowId)
            .sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
    };

    const commitFiles = (nextFiles: AnnouncementDetailFile[]) => {
        // 執行 function：回寫整份 formData
        props.formData.setFormData(prev => ({
            ...(prev ?? emptyData),
            AnnouncementDetailFile: nextFiles,
        }));
    };

    const addFile = () => {
        // 宣告變數
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: AnnouncementDetailFile = {
            ParentRowId: props.parentRowId,
            RowId: nextRowId,
            FileId: "",
            FileName: "",
        };

        // 執行 function
        commitFiles([...allFiles, newItem]);
    };

    const removeFileAt = (i: number) => {
        // 宣告變數
        const filtered = getFiles();
        const target = filtered[i];
        if (!target) return;

        // 執行 function
        const nextAll = allFiles.filter(f => !(f.ParentRowId === target.ParentRowId && f.RowId === target.RowId));
        commitFiles(nextAll);
    };

    // return（不動 div/DOM 結構）
    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">
                    新增附件
                </button>

                {getFiles().map((f, i) => {
                    const rowKeys = {
                        [AnnouncementDetailFileFields.AnnouncementId]: f.AnnouncementId,
                        [AnnouncementDetailFileFields.ParentRowId]: f.ParentRowId,
                        [AnnouncementDetailFileFields.RowId]: f.RowId,
                    };

                    return (
                        <div key={`${f.ParentRowId}-${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput
                                {...setFileField(
                                    AnnouncementSetFields.AnnouncementDetailFile,
                                    AnnouncementDetailFileFields.FileId,
                                    AnnouncementDetailFileFields.FileName,
                                    rowKeys,
                                    { defaultNameFromOriginal: "basename" },
                                )}
                                Accept="*/*"
                                onDelete={() => removeFileAt(i)}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};

// Category / Tag map by progId
const buildCategoryOptions = (rows: CategorySet[], progId: string, lang: Lang): Record<string, string> => {
    // 宣告變數
    const map: Record<string, string> = {};

    // 執行 function：過濾 ProgId 並找對應語系的名稱
    rows.forEach(r => {
        const cid = r.Category?.CategoryId ?? "";
        const p = r.Category?.ProgId ?? "";
        if (!cid || p !== progId) return;

        const name =
            (r.CategoryDetail ?? []).find(d => (d.Lang as unknown as string) === lang)?.CategoryName ??
            (r.CategoryDetail ?? [])[0]?.CategoryName ??
            cid;

        map[cid] = name ?? cid;
    });

    // return
    return map;
};

const buildTagOptions = (rows: TagSet[], progId: string, lang: Lang): Record<string, string> => {
    // 宣告變數
    const map: Record<string, string> = {};

    // 執行 function：過濾 ProgId 並找對應語系的名稱
    rows.forEach(r => {
        const tid = r.TagData?.TagId ?? "";
        const p = r.TagData?.ProgId ?? "";
        if (!tid || p !== progId) return;

        const name =
            (r.TagDetail ?? []).find(d => (d.Lang as unknown as string) === lang)?.TagName ??
            (r.TagDetail ?? [])[0]?.TagName ??
            tid;

        map[tid] = name ?? tid;
    });

    // return
    return map;
};

// Category / Tag options by progId
const useCategoryMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const adapter = useMemo(() => CategoryAdapter(), []);

    const q = adapter.hooks.useQueryList({
        condition: { PageNumber: 1, PageSize: 9999 },
        deps: [progId, lang],
    });

    // return
    return {
        data: buildCategoryOptions(q.data ?? [], progId, lang),
        isLoading: q.isLoading,
        error: q.errorText,
    };
};

const useTagMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const adapter = useMemo(() => TagAdapter(), []);

    const q = adapter.hooks.useQueryList({
        condition: { PageNumber: 1, PageSize: 9999 },
        deps: [progId, lang],
    });

    // return
    return {
        data: buildTagOptions(q.data ?? [], progId, lang),
        isLoading: q.isLoading,
        error: q.errorText,
    };
};