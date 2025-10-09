import { LibCheckBox, LibTextBox, LibCalendar, LibTinyMCE, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useState, useMemo } from 'react';
import * as SchemaFields from "@/types/SchemaFields";
import { useGetCategoryListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
type GallerySet = components["schemas"]["GallerySet_DTO"]
const emptyData: GallerySet = { Gallery: {}, GalleryInfo: [], GalleryPhotos: [], GalleryPhotosInfo: [], }
/** 相簿表單
 * @returns 
 */
export const Server_GalleryFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const formData = useFetchFormData<GallerySet>(GalleryProvider(), internalId, emptyData)
    const useCategory = useGetCategoryListByProgId(SchemaFields.GallerySetFields.Gallery, prop.lang);
    const useTag = useGetTagListByProgId(SchemaFields.GallerySetFields.Gallery, prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const status = useMemo(() => { const src = useContentStatus.data ?? {}; const { ["0"]: _drop, ...rest } = src; return rest as Record<string, string>; }, [useContentStatus.data]);
    useEnsureLangDetails(formData, { headerName: SchemaFields.GallerySetFields.Gallery, detailName: SchemaFields.GallerySetFields.GalleryInfo, parentKeys: [SchemaFields.GalleryInfoFields.GalleryId], preferFirstLang: prop.lang });
    useEnsureLangDetails(formData, { headerName: SchemaFields.GallerySetFields.GalleryPhotos, detailName: SchemaFields.GallerySetFields.GalleryPhotosInfo, parentKeys: [SchemaFields.GalleryPhotosInfoFields.GalleryId, SchemaFields.GalleryPhotosInfoFields.ParentRowId], preferFirstLang: prop.lang });
    const actions = useActions(dirUrl, GalleryProvider(), formData.data, internalId ?? "")
    const isLoading = [formData.isLoading, useCategory.isLoading, useTag.isLoading, useContentStatus.isLoading]
    const errors = [formData.error, useCategory.error, useTag.error, useContentStatus.error]
    const formProp: FormCompProp = { Title: "新增相簿", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={formProp}>
            <MainFormComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={status} tagOpts={useTag.data}></MainFormComp>
        </FormComp>
    )
}


const MainFormComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Album": "相簿", "Photo": "相片" } }
    const components: Record<string, React.ReactNode[]> = {
        Album: [<AlbumComp theme={prop.theme} formData={prop.formData} cateOpts={prop.cateOpts} statusOpts={prop.statusOpts} tagOpts={prop.tagOpts} />,
        <AlbumInfo theme={prop.theme} formData={prop.formData} />],
        Photo: [<UploadPicComp theme={prop.theme} formData={prop.formData} />, <PhotoComp theme={prop.theme} formData={prop.formData} />]
    }
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>
}


const AlbumComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤" } }
    const components: Record<string, React.ReactNode[]> = {
        Basic: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Categories, 'string', undefined, 'csv')} />,
        <LibCalendar {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Validate_Start, 'datetime')} ></LibCalendar>],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Tags, 'string', undefined, 'csv')} />,]
    }
    return (<TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>)
}

const AlbumInfo = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>; }) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const rawDetails = prop.formData.data?.GalleryInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.GalleryInfoFields.GalleryId]: info.GalleryId, [SchemaFields.GalleryInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Title, "string", rowKeys)} />,
                <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Content, "string", rowKeys)} />,
            ]
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}
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
                credentials: "include", // 帶上 JWT Cookie
                mode: "cors",
            });
            // 若非 2xx，丟出讓外層 fallback
            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                const err = new Error(`Upload ${file.name} failed: ${resp.status} ${text}`);
                (err as any).status = resp.status;
                throw err;
            }
            return resp.json().catch(() => ({}));
        };

        // 逐檔上傳；先用 "file"，失敗 (400) 再試 "files"
        for (const file of selectedFiles) {
            try {
                let json: any;
                try {
                    json = await doUpload(file, "file");
                } catch (e: any) {
                    if ((e?.status ?? 0) === 400) {
                        // 後端可能用 List<IFormFile> files
                        json = await doUpload(file, "files");
                    } else {
                        throw e;
                    }
                }
                // 兼容多種回傳外觀
                const id = json.Data[0]
                if (!id) {
                    // 讓你在 Console 看到實際回傳
                    console.error("Upload ok but cannot find InternalId in response:", json);
                    throw new Error(`Upload ${file.name}: missing InternalId`);
                }
                results.push(String(id));
            } catch (err) {
                console.error("upload failed:", err);
                throw err; // 丟出去讓 LibModal 顯示失敗（不自動關閉）
            }
        }
        return results;
    };

    // 寫入到 formData：新增 GalleryPhotos，RowId 依「同一個 GalleryId」自增
    const appendPhotosToForm = (picIds: string[]) => {
        prop.formData.setFormData(prev => {
            const draft: any = { ...(prev ?? {}) };

            const header = draft[SchemaFields.GallerySetFields.Gallery] ?? {};
            const galleryId = header[SchemaFields.GalleryFields.GalleryId] ?? "";

            const list = draft[SchemaFields.GallerySetFields.GalleryPhotos] ?? [];
            // 只看同一個 GalleryId 的最大 RowId
            const base = (list as any[]).reduce((m, it) =>
                it?.[SchemaFields.GalleryPhotosFields.GalleryId] === galleryId
                    ? Math.max(m, Number(it?.[SchemaFields.GalleryPhotosFields.RowId] || 0))
                    : m, 0);

            const newItems = picIds.map((pid, i) => ({
                [SchemaFields.GalleryPhotosFields.GalleryId]: galleryId,
                [SchemaFields.GalleryPhotosFields.RowId]: base + i + 1,
                [SchemaFields.GalleryPhotosFields.PicSrcId]: pid,
                // 方便排序：預設用 RowId
                [SchemaFields.GalleryPhotosFields.Sort]: base + i + 1,
            }));

            draft[SchemaFields.GallerySetFields.GalleryPhotos] = [...list, ...newItems];

            // 若尚未設定封面，第一張自動當封面（可保留/可移除）
            if (!header[SchemaFields.GalleryFields.CoverPicSrcId] && picIds[0]) {
                draft[SchemaFields.GallerySetFields.Gallery] = {
                    ...header,
                    [SchemaFields.GalleryFields.CoverPicSrcId]: picIds[0],
                };
            }
            return draft;
        });
    };

    // 儲存並上傳
    const handleUpload = async () => {
        if (selectedFiles.length === 0 || isUploading) return;
        try {
            setError(null);
            setIsUploading(true);
            const internalIds = await uploadAll();
            appendPhotosToForm(internalIds);
            setSelectedFiles([]);
            // 成功後 LibModal 會自動關閉（因為我們沒把 confirmAutoClose 設成 false）
        } catch (e: any) {
            setError(e?.message ?? String(e));
            // 發生錯誤時，LibModal 不會自動關閉（因為 throw 被吃掉了）；你可視需要在錯誤時 return reject
            throw e; // 若想阻止關閉可把錯誤 rethrow 出去
        } finally {
            setIsUploading(false);
        }
    };

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
    const selected = (formData.data as any)?.[SchemaFields.GallerySetFields.Gallery] ? (formData.data as any)[SchemaFields.GallerySetFields.Gallery][SchemaFields.GalleryFields.CoverPicSrcId] : null;
    const select = (picId: string) => {
        formData.setFormData(prev => {
            const draft: any = { ...(prev ?? {}) };
            const g = draft[SchemaFields.GallerySetFields.Gallery] ?? {};
            draft[SchemaFields.GallerySetFields.Gallery] = { ...g, [SchemaFields.GalleryFields.CoverPicSrcId]: picId, };
            return draft;
        });
    };

    return { selected, select };
};

const usePhotoRemove = (formData: UseFetchFormDataResult<GallerySet>) => {
    const remove = (galleryId?: string, rowId?: number, picSrcId?: string) => {
        if (!galleryId || rowId == null) return;
        formData.setFormData(prev => {
            // 以完整結構為基礎，確保提交資料「真的」更新
            const base: GallerySet = prev ?? { Gallery: {}, GalleryInfo: [], GalleryPhotos: [], GalleryPhotosInfo: [] };
            const photos = base.GalleryPhotos ?? [];
            const details = base.GalleryPhotosInfo ?? [];
            const nextPhotos = photos.filter(p => !(p?.GalleryId === galleryId && p?.RowId === rowId));
            const nextDetails = details.filter(d => !(d?.GalleryId === galleryId && d?.ParentRowId === rowId));
            // 如果刪到目前封面，換成剩下第一張；沒有就清空
            const header = base.Gallery ?? {};
            const nextHeader = { ...header };
            if (picSrcId && header[SchemaFields.GalleryFields.CoverPicSrcId] === picSrcId) {
                nextHeader[SchemaFields.GalleryFields.CoverPicSrcId] =
                    nextPhotos[0]?.[SchemaFields.GalleryPhotosFields.PicSrcId] ?? null;
            }
            // 以「整份物件」方式提交，確保資料狀態一致（與 Announcement 附件刪除相同風格）
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
    const photos = prop.formData?.data?.GalleryPhotos ?? []
    const remover = usePhotoRemove(prop.formData);

    const dom =
        (<>
            {photos.map((item) => {
                const picId = String(item.PicSrcId ?? "");
                const rowKeys = { [SchemaFields.GalleryPhotosFields.GalleryId]: item.GalleryId, [SchemaFields.GalleryPhotosFields.RowId]: item.RowId }
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
                )
            })}
        </>)
    return (dom)
}

const PhotoInfoComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<GallerySet>; parentRowId: number }) => {
    const setField = useSetTableField<GallerySet>(prop.formData);
    const rawDetails = prop.formData.data?.GalleryPhotosInfo?.filter(p => p.ParentRowId === prop.parentRowId) ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.ParentRowId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.GalleryId, info.ParentRowId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.GalleryPhotosInfoFields.GalleryId]: info.GalleryId, [SchemaFields.GalleryPhotosInfoFields.ParentRowId]: info.ParentRowId, [SchemaFields.GalleryPhotosInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [<LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.GallerySetFields.GalleryPhotosInfo, SchemaFields.GalleryPhotosInfoFields.Title, "string", rowKeys)} />,]
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}