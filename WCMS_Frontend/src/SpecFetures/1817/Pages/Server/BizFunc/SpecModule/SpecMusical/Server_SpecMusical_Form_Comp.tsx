import { LibTextBox, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle, LibDropList, LibTextArea, LibFileInput } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useState, useMemo } from 'react';
import { type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { PGID, SpecMusicalModelFields, SpecMusicalPictureListFields, SpecMusicalSetFields, SpecMusicalSoundListFields } from "@/types/SchemaFields";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/SpecModule/SpecMusical/SpecMusical_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"]
type SpecMusicalSoundList = components["schemas"]["SpecMusicalSoundList_DTO"]
const emptyData: SpecMusicalSet = {}

export const Server_SpecMusical_Form_Comp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);

    const adapter = useMemo(() => SpecMusicalAdapter(), []);
    const formData = useAnnouncementFormDataByAdapter(adapter, internalId ?? "", emptyData);

    const catAdapter = useMemo(() => CategoryAdapter(), []);
    const useCategory = useMemo(() => catAdapter.hooks.useMapByProgId({ progId: PGID.SpecMusical, lang: prop.lang }), []);

    const actions = useActions(dirUrl, provider, formData.data, internalId ?? "")

    const isLoading = [formData.isLoading, useCategory.isLoading]
    const errors = [formData.error, useCategory.errorText]

    const formProp: FormCompProp = { Title: "琵琶介紹", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={formProp}>
            <MainFormComp theme={prop.theme} formData={formData} cateOpts={useCategory.map}></MainFormComp>
        </FormComp>
    )
}


const MainFormComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; cateOpts: Record<string, string>; }) => {
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本資料", "Photo": "相片", "Sound": "音檔", } }
    const components: Record<string, React.ReactNode[]> = {
        Basic: [<AlbumComp theme={prop.theme} formData={prop.formData} cateOpts={prop.cateOpts} />],
        Photo: [<UploadPicComp theme={prop.theme} formData={prop.formData} />, <PhotoComp theme={prop.theme} formData={prop.formData} />],
        Sound: [<SoundFileComp theme={prop.theme} formData={prop.formData} />]
    }
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>
}


const AlbumComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; cateOpts: Record<string, string>; }) => {
    const setField = useSetTableField<SpecMusicalSet>(props.formData);

    return (
        <>
            <div className="col-12 form-group">
                <LibDropList Style={props.theme.DropList} Options={props.cateOpts} {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.CategoryId, 'string')} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.MusicalName, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Specification, "string")} />
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Headstock, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Backboard, "string")} />
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.ScaleLength, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Bridge, "string")} />
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.BodyForm, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Material, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextArea Style={props.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Info, "string")} />
            </div>

        </>)
}

const UploadPicComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet> }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // 逐張打 UploadTemp，回傳 InternalId 陣列
    const uploadAll = async (): Promise<string[]> => {
        const results: string[] = [];
        const url = FileManagementAPI.Server_UploadTemp;
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
            const header = draft[SpecMusicalSetFields.SpecMusical] ?? {};
            const musicalId = header[SpecMusicalModelFields.MusicalId] ?? "";
            const list = draft[SpecMusicalSetFields.SpecMusicalPictureList] ?? [];
            // 只看同一個 GalleryId 的最大 RowId
            const base = (list as any[]).reduce((m, it) => it?.[SpecMusicalPictureListFields.MusicalId] === musicalId ? Math.max(m, Number(it?.[SpecMusicalPictureListFields.RowId] || 0)) : m, 0);
            const newItems = picIds.map((pid, i) => ({
                [SpecMusicalPictureListFields.MusicalId]: musicalId,
                [SpecMusicalPictureListFields.RowId]: base + i + 1,
                [SpecMusicalPictureListFields.PicSrcId]: pid,
                [SpecMusicalPictureListFields.Sort]: base + i + 1,
            }));
            draft[SpecMusicalSetFields.SpecMusicalPictureList] = [...list, ...newItems];
            // 若尚未設定封面，第一張自動當封面（可保留/可移除）
            if (!header[SpecMusicalModelFields.CoverPicId] && picIds[0]) draft[SpecMusicalSetFields.SpecMusical] = { ...header, [SpecMusicalModelFields.CoverPicId]: picIds[0], };
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

const useCoverPicSelector = (formData: UseFetchFormDataResult<SpecMusicalSet>) => {
    const selected = (formData.data as any)?.[SpecMusicalSetFields.SpecMusical] ? (formData.data as any)[SpecMusicalSetFields.SpecMusical][SpecMusicalModelFields.CoverPicId] : null;
    const select = (picId: string) => {
        formData.setFormData(prev => {
            const draft: any = { ...(prev ?? {}) };
            const g = draft[SpecMusicalSetFields.SpecMusical] ?? {};
            draft[SpecMusicalSetFields.SpecMusical] = { ...g, [SpecMusicalModelFields.CoverPicId]: picId, };
            return draft;
        });
    };

    return { selected, select };
};

const usePhotoRemove = (formData: UseFetchFormDataResult<SpecMusicalSet>) => {
    const remove = (musicalId?: string, rowId?: number, picSrcId?: string) => {
        if (!musicalId || rowId == null) return;
        formData.setFormData(prev => {
            // 以完整結構為基礎，確保提交資料「真的」更新
            const base: SpecMusicalSet = prev ?? { SpecMusical: {}, SpecMusicalPictureList: [], SpecMusicalSoundList: [] };
            const photos = base.SpecMusicalPictureList ?? [];
            const nextPhotos = photos.filter(p => !(p?.MusicalId === musicalId && p?.RowId === rowId));
            // 如果刪到目前封面，換成剩下第一張；沒有就清空
            const header = base.SpecMusical ?? {};
            const nextHeader = { ...header };
            if (picSrcId && header[SpecMusicalModelFields.CoverPicId] === picSrcId) {
                nextHeader[SpecMusicalModelFields.CoverPicId] =
                    nextPhotos[0]?.[SpecMusicalPictureListFields.PicSrcId] ?? null;
            }
            // 以「整份物件」方式提交，確保資料狀態一致（與 Announcement 附件刪除相同風格）
            return {
                ...base,
                SpecMusical: nextHeader,
                SpecMusicalPictureList: nextPhotos,
            };
        });
    };
    return { remove };
};


const PhotoComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; }) => {
    const setField = useSetTableField<SpecMusicalSet>(prop.formData);
    const cover = useCoverPicSelector(prop.formData);
    const photos = prop.formData?.data?.SpecMusicalPictureList ?? []
    const remover = usePhotoRemove(prop.formData);
    const dom =
        (<>
            {photos.map((item) => {
                const picId = String(item.PicSrcId ?? "");
                const rowKeys = { [SpecMusicalPictureListFields.MusicalId]: item.MusicalId, [SpecMusicalPictureListFields.RowId]: item.RowId }
                const picUrl =FileManagementAPI.get_Server_Preview_Url(item.PicSrcId)
                return (
                    <LibPicture parentClass="col-xl-3 col-md-4 col-12" ColumnDisplayName="測試" PicSrc={picUrl} PicDescription="文字">
                        <div className="row">
                            <div className="col-6">
                                <LibCheckBoxSingle name="coverPic" checkboxStyle="radio" options={[{ itemId: picId, itemDisplayName: "選擇封面" }]}
                                    value={cover.selected ? [String(cover.selected)] : []} onChange={(ids) => { const id = ids?.[0]; if (id) cover.select(id); }} />
                            </div>
                            <div className="col-6 d-flex justify-content-end">
                                <div className="all-btn">
                                    <a id="trash" className="icon" href="#" onClick={() => {
                                        if (!window.confirm('確定要刪除這張相片嗎？')) return;
                                        remover.remove(String(item.MusicalId ?? ''), Number(item.RowId ?? 0), picId);
                                    }} title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                                            <i className="far fa-trash-alt"></i>
                                        </button>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <LibTextBox Style={prop.theme.TextBox2} DefaultInputDisplay={"請輸入"}  {...setField(SpecMusicalSetFields.SpecMusicalPictureList, SpecMusicalPictureListFields.Sort, "number", rowKeys)} />
                        <LibTextBox Style={prop.theme.TextBox2} DefaultInputDisplay={"請輸入"}  {...setField(SpecMusicalSetFields.SpecMusicalPictureList, SpecMusicalPictureListFields.Info, "string", rowKeys)} />
                    </LibPicture>
                )
            })}
        </>)
    return (dom)
}



const SoundFileComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; }) => {
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: SpecMusicalSoundList[] = props.formData.data?.SpecMusicalSoundList ?? [];
    const getFiles = (): SpecMusicalSoundList[] => allFiles.sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: SpecMusicalSoundList[]) => {
        props.formData.setFormData(prev => ({
            ...(prev ?? { SpecMusical: {}, SpecMusicalPictureList: [], SpecMusicalSoundList: [] }),
            SpecMusicalSoundList: nextFiles,
        }));
    };
    // 新增一筆附件列
    const addFile = () => {
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: SpecMusicalSoundList = { RowId: nextRowId, SoundSrcId: "", Info: "", };
        commitFiles([...allFiles, newItem]);
    };
    // 刪除第 i 筆附件列
    const removeFileAt = (i: number) => {
        const filtered = getFiles();
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.RowId === target.RowId));
        commitFiles(nextAll);
    };
    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">新增附件</button>
                {getFiles().map((f, i) => {
                    const rowKeys = { [SpecMusicalSoundListFields.MusicalId]: f.MusicalId, [SpecMusicalSoundListFields.RowId]: f.RowId, }
                    return (
                        <div key={`${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput {...setFileField(SpecMusicalSetFields.SpecMusicalSoundList, SpecMusicalSoundListFields.SoundSrcId, SpecMusicalSoundListFields.Info, rowKeys, { defaultNameFromOriginal: "basename" })}
                                Accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg" onDelete={() => removeFileAt(i)} />
                        </div>
                    )
                })}
            </div>
        </>
    );
};