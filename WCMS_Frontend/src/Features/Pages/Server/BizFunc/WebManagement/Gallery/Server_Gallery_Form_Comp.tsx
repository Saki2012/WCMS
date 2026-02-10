import { LibCheckBox, LibTextBox, LibCalendar, LibTinyMCE, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as SchemaFields from "@/types/SchemaFields";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import type { ModelDisplaySchema } from "@/types/IApiSchema";

import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";

import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";

type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

const emptyData: GallerySet = { Gallery: {}, GalleryInfo: [], GalleryPhotos: [], GalleryPhotosInfo: [] };

/** 相簿表單 */
export const Server_GalleryFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const adapter = useMemo(() => GalleryAdapter(), []);

    const formData = useGalleryFormDataByAdapter(adapter, internalId ?? "", emptyData);

    // Category / Tag：改走 useMapByProgId（對標 Announcement）
    const category = useCategoryMapByProgId(SchemaFields.PGID.Gallery, prop.lang);
    const tag = useTagMapByProgId(SchemaFields.PGID.Gallery, prop.lang);

    const useContentStatus = useFetchEnumOptions("ContentStatus");
    const status = useMemo(() => {
        // 宣告變數
        const src = useContentStatus.data ?? {};
        const { ["0"]: _drop, ...rest } = src;

        // return
        return rest as Record<string, string>;
    }, [useContentStatus.data]);

    // 多語系 detail 補齊：相簿 info
    useEnsureLangDetails(formData, {
        headerName: SchemaFields.GallerySetFields.Gallery,
        detailName: SchemaFields.GallerySetFields.GalleryInfo,
        parentKeys: [SchemaFields.GalleryInfoFields.GalleryId],
        preferFirstLang: prop.lang,
    });

    // 多語系 detail 補齊：相片 info（依 parentRow）
    useEnsureLangDetails(formData, {
        headerName: SchemaFields.GallerySetFields.GalleryPhotos,
        detailName: SchemaFields.GallerySetFields.GalleryPhotosInfo,
        parentKeys: [SchemaFields.GalleryPhotosInfoFields.GalleryId, SchemaFields.GalleryPhotosInfoFields.ParentRowId],
        preferFirstLang: prop.lang,
    });

    const onBackToList = useCallback(() => {
        // 執行 function：回列表
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const actions = useGalleryFormActionsFromAdapter(adapter, internalId ?? "", formData.data, onBackToList);

    const isLoading = [formData.isLoading, category.isLoading, tag.isLoading, useContentStatus.isLoading];
    const errors = [formData.error, category.error, tag.error, useContentStatus.error];

    const formProp: FormCompProp = {
        Title: internalId ? "修改相簿" : "新增相簿",
        Theme: prop.theme,
        LoadingList: isLoading,
        ErrorList: errors,
        Actions: actions,
    };

    // return（⚠️ 不改 div/DOM 結構）
    return (
        <FormComp prop={formProp}>
            <MainFormComp
                theme={prop.theme}
                formData={formData}
                cateOpts={category.data}
                statusOpts={status}
                tagOpts={tag.data}
            ></MainFormComp>
        </FormComp>
    );
};

/** FormData：QueryData + ModelDisplayName（對標 Announcement） */
const useGalleryFormDataByAdapter = (
    adapter: ReturnType<typeof GalleryAdapter>,
    internalId: string,
    empty: GallerySet,
): UseFetchFormDataResult<GallerySet> => {
    // 宣告變數
    const { publish } = useToast();

    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, GallerySet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<GallerySet> = { IsSuccess: true, Data: empty, SysMessage: [] };
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

    const [data, setData] = useState<GallerySet>(empty);

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
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

/** Actions：改用 Adapter.useServerActions（對標 Announcement） */
const useGalleryFormActionsFromAdapter = (
    adapter: ReturnType<typeof GalleryAdapter>,
    internalId: string,
    formData: GallerySet,
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
        Preview: () => { /* Gallery 目前無 Preview */ },
        IsSaving: actions.isSaving,
    };
};

/** Category：useMapByProgId → options map（對標 Announcement） */
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

    // return
    return {
        data: query.map ?? ({} as Record<string, string>),
        rawData: (query.data ?? []) as CategorySet[],
        isLoading: Boolean(query.isLoading),
        error,
    };
};

/** Tag：useMapByProgId → options map（對標 Announcement） */
const useTagMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const adapter = useMemo(() => TagAdapter(), []);
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

    // return
    return {
        data: query.map ?? ({} as Record<string, string>),
        rawData: (query.data ?? []) as TagSet[],
        isLoading: Boolean(query.isLoading),
        error,
    };
};

const MainFormComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Album": "相簿", "Photo": "相片" } };
    const components: Record<string, React.ReactNode[]> = {
        Album: [
            <AlbumComp theme={prop.theme} formData={prop.formData} cateOpts={prop.cateOpts} statusOpts={prop.statusOpts} tagOpts={prop.tagOpts} />,
            <AlbumInfo theme={prop.theme} formData={prop.formData} />
        ],
        Photo: [
            <UploadPicComp theme={prop.theme} formData={prop.formData} />,
            <PhotoComp theme={prop.theme} formData={prop.formData} />
        ]
    };
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

const AlbumComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤" } };
    const components: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Categories, 'string', undefined, 'csv')} />,
            <LibCalendar {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Validate_Start, 'datetime')}></LibCalendar>
        ],
        Status: [
            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.statusOpts}
                {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })}
            />
        ],
        Tags: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Tags, 'string', undefined, 'csv')} />,
        ]
    };
    return (<TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>);
};

const AlbumInfo = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>; }) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const rawDetails = prop.formData.data?.GalleryInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.RowId, info.Lang);
            const rowKeys = { [SchemaFields.GalleryInfoFields.GalleryId]: info.GalleryId, [SchemaFields.GalleryInfoFields.RowId]: info.RowId };
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Title, "string", rowKeys)} />,
                <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Content, "string", rowKeys)} />,
            ];
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>);
};

type UploadError = Error & { status?: number };
type UploadJson = { Data?: string[] };

const UploadPicComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<GallerySet> }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 逐張打 UploadTemp，回傳 InternalId 陣列
    const uploadAll = async (): Promise<string[]> => {
        const results: string[] = [];
        const url = FileManagementAPI.UPLOAD_URL;

        // 小工具：實際送出
        const doUpload = async (file: File, fieldName: "file" | "files") => {
            const fd = new FormData();
            fd.append(fieldName, file, file.name);
            const resp = await fetch(url, {
                method: "POST",
                body: fd,
                credentials: "include",
                mode: "cors",
            });
            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                const err: UploadError = new Error(`Upload ${file.name} failed: ${resp.status} ${text}`);
                err.status = resp.status;
                throw err;
            }
            return (await resp.json().catch(() => ({}))) as UploadJson;
        };

        // 逐檔上傳；先用 "file"，失敗 (400) 再試 "files"
        for (const file of selectedFiles) {
            try {
                let json: UploadJson;
                try {
                    json = await doUpload(file, "file");
                } catch (e) {
                    const err = e as UploadError;
                    if ((err?.status ?? 0) === 400) json = await doUpload(file, "files");
                    else throw err;
                }

                const id = json.Data?.[0];
                if (!id) {
                    console.error("Upload ok but cannot find InternalId in response:", json);
                    throw new Error(`Upload ${file.name}: missing InternalId`);
                }
                results.push(String(id));
            } catch (err) {
                console.error("upload failed:", err);
                throw err;
            }
        }
        return results;
    };

    // 寫入到 formData：新增 GalleryPhotos，RowId 依「同一個 GalleryId」自增
    const appendPhotosToForm = (picIds: string[]) => {
        prop.formData.setFormData(prev => {
            const base: GallerySet = prev ?? { Gallery: {}, GalleryInfo: [], GalleryPhotos: [], GalleryPhotosInfo: [] };

            const header = base[SchemaFields.GallerySetFields.Gallery] ?? {};
            const galleryId = header[SchemaFields.GalleryFields.GalleryId] ?? "";

            const list = base[SchemaFields.GallerySetFields.GalleryPhotos] ?? [];
            const baseRow = (list ?? []).reduce((m, it) =>
                it?.[SchemaFields.GalleryPhotosFields.GalleryId] === galleryId
                    ? Math.max(m, Number(it?.[SchemaFields.GalleryPhotosFields.RowId] || 0))
                    : m, 0);

            const newItems = picIds.map((pid, i) => ({
                [SchemaFields.GalleryPhotosFields.GalleryId]: galleryId,
                [SchemaFields.GalleryPhotosFields.RowId]: baseRow + i + 1,
                [SchemaFields.GalleryPhotosFields.PicSrcId]: pid,
                [SchemaFields.GalleryPhotosFields.Sort]: baseRow + i + 1,
            }));

            const nextHeader = { ...header };
            if (!nextHeader[SchemaFields.GalleryFields.CoverPicSrcId] && picIds[0]) {
                nextHeader[SchemaFields.GalleryFields.CoverPicSrcId] = picIds[0];
            }

            return {
                ...base,
                Gallery: nextHeader,
                GalleryPhotos: [...list, ...newItems],
            };
        });
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0 || isUploading) return;
        try {
            setError(null);
            setIsUploading(true);
            const internalIds = await uploadAll();
            appendPhotosToForm(internalIds);
            setSelectedFiles([]);
        } catch (e) {
            const err = e as Error;
            setError(err?.message ?? String(err));
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    // return（⚠️ 不改 div/DOM 結構）
    return (
        <LibModal ModalName="上傳圖片" BtnName1="關閉" BtnName2="儲存並上傳" onConfirm={handleUpload} confirmDisabled={isUploading || selectedFiles.length === 0} confirmBusy={isUploading}>
            <div className="row mx-0">
                {/* 選擇欲上傳的圖片(多選) */}
                <div className="col-12">
                    <div className="row">
                        <LibFile Style={prop.theme.File} ColumnDisplayName="選擇圖片(多選)" Multiple={true} onChange={(files) => setSelectedFiles(files)} InputValue={""} />
                    </div>
                    {error && <div className="col-12 alert alert-danger mt-2">{error}</div>}
                </div>
                {/* 預覽 */}
                {selectedFiles.length > 0 && (
                    <div className="col-12">
                        <div className="row mt-3 mx-0">
                            <div className="col-12 col-form-label bg-secondary mb-1">預覽圖片</div>
                            {selectedFiles.map((file, index) => {
                                const url = URL.createObjectURL(file);
                                return (
                                    <div key={index} className="col-12 border-bottom">
                                        <div className="d-flex align-items-center">
                                            <LibPicturePreview
                                                ColumnDisplayName={file.name}
                                                PicSrc={url}
                                                PicDescription={`選中的圖片 ${file.name}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </LibModal>
    );
};

const useCoverPicSelector = (formData: UseFetchFormDataResult<GallerySet>) => {
    const selected = formData.data?.[SchemaFields.GallerySetFields.Gallery]?.[SchemaFields.GalleryFields.CoverPicSrcId] ?? null;

    const select = (picId: string) => {
        formData.setFormData(prev => {
            const base: GallerySet = prev ?? { Gallery: {}, GalleryInfo: [], GalleryPhotos: [], GalleryPhotosInfo: [] };
            const g = base[SchemaFields.GallerySetFields.Gallery] ?? {};
            return {
                ...base,
                Gallery: { ...g, [SchemaFields.GalleryFields.CoverPicSrcId]: picId },
            };
        });
    };

    return { selected, select };
};

const usePhotoRemove = (formData: UseFetchFormDataResult<GallerySet>) => {
    const remove = (galleryId?: string, rowId?: number, picSrcId?: string) => {
        if (!galleryId || rowId == null) return;
        formData.setFormData(prev => {
            const base: GallerySet = prev ?? { Gallery: {}, GalleryInfo: [], GalleryPhotos: [], GalleryPhotosInfo: [] };
            const photos = base.GalleryPhotos ?? [];
            const details = base.GalleryPhotosInfo ?? [];

            const nextPhotos = photos.filter(p => !(p?.GalleryId === galleryId && p?.RowId === rowId));
            const nextDetails = details.filter(d => !(d?.GalleryId === galleryId && d?.ParentRowId === rowId));

            const header = base.Gallery ?? {};
            const nextHeader = { ...header };
            if (picSrcId && header[SchemaFields.GalleryFields.CoverPicSrcId] === picSrcId) {
                nextHeader[SchemaFields.GalleryFields.CoverPicSrcId] = nextPhotos[0]?.[SchemaFields.GalleryPhotosFields.PicSrcId] ?? null;
            }

            return {
                ...base,
                Gallery: nextHeader,
                GalleryPhotos: nextPhotos,
                GalleryPhotosInfo: nextDetails,
            };
        });
    };
    return { remove };
};

const PhotoComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>; }) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const cover = useCoverPicSelector(prop.formData);
    const photos = prop.formData?.data?.GalleryPhotos ?? [];
    const remover = usePhotoRemove(prop.formData);

    const dom =
        (<>
            {photos.map((item) => {
                const picId = String(item.PicSrcId ?? "");
                const rowKeys = { [SchemaFields.GalleryPhotosFields.GalleryId]: item.GalleryId, [SchemaFields.GalleryPhotosFields.RowId]: item.RowId };
                return (
                    <LibPicture parentClass="col-xl-3 col-md-4 col-12" ColumnDisplayName="測試" PicSrc={`${FileManagementAPI.PREVIEW_URL}/${item.PicSrcId}`} PicDescription="文字">
                        <div className="row">
                            <div className="col-6">
                                <LibCheckBoxSingle name="coverPic" checkboxStyle="radio" options={[{ itemId: picId, itemDisplayName: "選擇封面" }]}
                                    value={cover.selected ? [String(cover.selected)] : []} onChange={(ids) => { const id = ids?.[0]; if (id) cover.select(id); }} />
                            </div>
                            <div className="col-6 d-flex justify-content-end">
                                <div className="all-btn">
                                    <a id="trash" className="icon" href="#" onClick={() => {
                                        if (!window.confirm('確定要刪除這張相片嗎？')) return;
                                        remover.remove(String(item.GalleryId ?? ''), Number(item.RowId ?? 0), picId);
                                    }} title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                                            <i className="far fa-trash-alt"></i>
                                        </button>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <LibTextBox Style={prop.theme.TextBox2} DefaultInputDisplay={"請輸入"}  {...setField(SchemaFields.GallerySetFields.GalleryPhotos, SchemaFields.GalleryPhotosFields.Sort, "number", rowKeys)} />
                        <PhotoInfoComp theme={prop.theme} formData={prop.formData} parentRowId={item.RowId ?? 0} />
                    </LibPicture>
                );
            })}
        </>);
    return (dom);
};

const PhotoInfoComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>; parentRowId: number }) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const rawDetails = prop.formData.data?.GalleryPhotosInfo?.filter(p => p.ParentRowId === prop.parentRowId) ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.ParentRowId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.ParentRowId, info.RowId, info.Lang);
            const rowKeys = { [SchemaFields.GalleryPhotosInfoFields.GalleryId]: info.GalleryId, [SchemaFields.GalleryPhotosInfoFields.ParentRowId]: info.ParentRowId, [SchemaFields.GalleryPhotosInfoFields.RowId]: info.RowId };
            compMap[langKey] = [<LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.GallerySetFields.GalleryPhotosInfo, SchemaFields.GalleryPhotosInfoFields.Title, "string", rowKeys)} />,];
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>);
};
