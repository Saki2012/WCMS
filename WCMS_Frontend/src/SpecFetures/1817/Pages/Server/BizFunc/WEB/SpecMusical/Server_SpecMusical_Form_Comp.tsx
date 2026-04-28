import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import {
    LibCheckBoxSingle,
    LibDropList,
    LibFile,
    LibFileInput,
    LibModal,
    LibPicture,
    LibPicturePreview,
    LibTextArea,
    LibTextBox,
} from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { SpecMusicalModelFields, SpecMusicalPictureListFields, SpecMusicalSetFields, SpecMusicalSoundListFields } from "@/types/SchemaFields";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSpecMusicalFormFetchData } from "./Server_SpecMusical_Form_Hook";

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];
type SpecMusicalSoundList = components["schemas"]["SpecMusicalSoundList_DTO"];
type SpecMusicalPictureList = components["schemas"]["SpecMusicalPictureList_DTO"];

const emptyData: SpecMusicalSet = { SpecMusical: {}, SpecMusicalPictureList: [], SpecMusicalSoundList: [] };

export const Server_SpecMusical_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    /** 回列表 */
    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    /** 提供 Hook 用的 actions option */
    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    /** 所有資料從 Hook 取出 */
    const getData = useSpecMusicalFormFetchData({ lang: prop.lang, internalId: internalId ?? "", emptyData, actionsOpt });
    const cateOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(getData.rawData.categoryMap ?? {}));
    }, [getData.rawData.categoryMap]);
    /** Form 外框 props */
    const formProp: FormCompProp = {
        Title: internalId ? "修改琵琶介紹" : "新增琵琶介紹",
        Theme: prop.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };

    return (
        <FormComp prop={formProp}>
            <MainFormComp theme={prop.theme} formData={getData.rawData.formData} cateOpts={cateOpts} />
        </FormComp>
    );
};

const MainFormComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; cateOpts: Map<string, string>; }) =>
{
    /** 頁籤資訊 */
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { Basic: "基本資料", Photo: "相片", Sound: "音檔" } };

    /** 頁籤內容 */
    const components: Record<string, ReactNode[]> = {
        Basic: [<AlbumComp key="basic" theme={prop.theme} formData={prop.formData} cateOpts={prop.cateOpts} />],
        Photo: [
            <UploadPicComp key="upload-pic" theme={prop.theme} formData={prop.formData} />,
            <PhotoComp key="photo-list" theme={prop.theme} formData={prop.formData} />,
        ],
        Sound: [<SoundFileComp key="sound-file" theme={prop.theme} formData={prop.formData} />],
    };

    return <TabContentComp tabInfos={tabInfo} components={components} />;
};

const AlbumComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; cateOpts: Map<string, string>; }) =>
{
    /** 表單欄位綁定 */
    const setField = useSetTableField<SpecMusicalSet>(props.formData);

    return (
        <>
            <div className="col-12 form-group">
                <LibDropList
                    Style={props.theme.DropList}
                    Options={props.cateOpts}
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.CategoryId, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.MusicalName, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Specification, "string")}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Headstock, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Backboard, "string")}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.ScaleLength, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Bridge, "string")}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.BodyForm, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Material, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextArea
                    Style={props.theme.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Info, "string")}
                />
            </div>
        </>
    );
};

const UploadPicComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; }) =>
{
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** 讀取錯誤狀態碼 */
    const getErrorStatus = (error: unknown): number | null =>
    {
        if (!error || typeof error !== "object") return null;
        if (!("status" in error)) return null;
        return typeof error.status === "number" ? error.status : null;
    };

    /** 單檔上傳 */
    const doUpload = async (file: File, fieldName: "file" | "files") =>
    {
        const fd = new FormData();
        fd.append(fieldName, file, file.name);

        const resp = await fetch(FileManagementAPI.Server_UploadTemp, { method: "POST", body: fd, credentials: "include", mode: "cors" });

        if (!resp.ok)
        {
            const text = await resp.text().catch(() => "");
            const err = new Error(`Upload ${file.name} failed: ${resp.status} ${text}`) as Error & { status?: number; };
            err.status = resp.status;
            throw err;
        }

        const json = await resp.json().catch(() => ({ Data: [] as string[] }));
        return json as { Data?: string[]; };
    };

    /** 逐檔上傳 */
    const uploadAll = async (): Promise<string[]> =>
    {
        const results: string[] = [];

        for (const file of selectedFiles)
        {
            let json: { Data?: string[]; };

            try
            {
                json = await doUpload(file, "file");
            } catch (error)
            {
                const status = getErrorStatus(error);

                if (status !== 400)
                {
                    throw error;
                }

                json = await doUpload(file, "files");
            }

            const id = json.Data?.[0] ?? "";

            if (!id)
            {
                throw new Error(`Upload ${file.name}: missing InternalId`);
            }

            results.push(id);
        }

        return results;
    };

    /** 把上傳結果寫回 formData */
    const appendPhotosToForm = (picIds: string[]) =>
    {
        prop.formData.setFormData(prev =>
        {
            const base = prev ?? emptyData;
            const header = base.SpecMusical ?? {};
            const musicalId = header.MusicalId ?? "";
            const list = base.SpecMusicalPictureList ?? [];

            const maxRowId = list.reduce((max, item) =>
            {
                if (item?.MusicalId !== musicalId) return max;
                return Math.max(max, Number(item?.RowId ?? 0));
            }, 0);

            const newItems: SpecMusicalPictureList[] = picIds.map((picId, idx) =>
            {
                const nextRowId = maxRowId + idx + 1;

                return { MusicalId: musicalId, RowId: nextRowId, PicSrcId: picId, Sort: nextRowId };
            });

            const nextCoverPicId = header.CoverPicId ?? picIds[0] ?? null;

            return {
                ...base,
                SpecMusical: { ...header, CoverPicId: nextCoverPicId },
                SpecMusicalPictureList: [...list, ...newItems],
                SpecMusicalSoundList: base.SpecMusicalSoundList ?? [],
            };
        });
    };

    /** 觸發上傳 */
    const handleUpload = async () =>
    {
        if (selectedFiles.length === 0 || isUploading) return;

        try
        {
            setError(null);
            setIsUploading(true);

            const internalIds = await uploadAll();
            appendPhotosToForm(internalIds);
            setSelectedFiles([]);
        } catch (error)
        {
            setError(error instanceof Error ? error.message : "上傳失敗");
            throw error;
        } finally
        {
            setIsUploading(false);
        }
    };

    return (
        <LibModal
            ModalName="上傳圖片"
            BtnName1="關閉"
            BtnName2="儲存並上傳"
            onConfirm={handleUpload}
            confirmDisabled={isUploading || selectedFiles.length === 0}
            confirmBusy={isUploading}
        >
            <div className="row mx-0">
                <div className="col-12">
                    <div className="row">
                        <LibFile
                            Style={prop.theme.File}
                            ColumnDisplayName="選擇圖片(多選)"
                            Multiple={true}
                            onChange={(files) => setSelectedFiles(files)}
                            InputValue=""
                        />
                    </div>

                    {error && <div className="col-12 alert alert-danger mt-2">{error}</div>}
                </div>

                {selectedFiles.length > 0 && (
                    <div className="col-12">
                        <div className="row mt-3 mx-0">
                            <div className="col-12 col-form-label bg-secondary mb-1">預覽圖片</div>

                            {selectedFiles.map((file, index) =>
                            {
                                const url = URL.createObjectURL(file);

                                return (
                                    <div key={index} className="col-12 border-bottom">
                                        <div className="d-flex align-items-center">
                                            <LibPicturePreview ColumnDisplayName={file.name} PicSrc={url} PicDescription={`選中的圖片 ${file.name}`} />
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

const useCoverPicSelector = (formData: UseFetchFormDataResult<SpecMusicalSet>) =>
{
    /** 目前封面 */
    const selected = formData.data?.SpecMusical?.CoverPicId ?? null;

    /** 設定封面 */
    const select = (picId: string) =>
    {
        formData.setFormData(prev =>
        {
            const base = prev ?? emptyData;
            const header = base.SpecMusical ?? {};

            return { ...base, SpecMusical: { ...header, CoverPicId: picId } };
        });
    };

    return { selected, select };
};

const usePhotoRemove = (formData: UseFetchFormDataResult<SpecMusicalSet>) =>
{
    /** 刪除相片 */
    const remove = (musicalId?: string, rowId?: number, picSrcId?: string) =>
    {
        if (!musicalId || rowId == null) return;

        formData.setFormData(prev =>
        {
            const base = prev ?? emptyData;
            const photos = base.SpecMusicalPictureList ?? [];
            const nextPhotos = photos.filter(item =>
            {
                return !(item?.MusicalId === musicalId && item?.RowId === rowId);
            });

            const header = base.SpecMusical ?? {};
            const nextHeader = { ...header };

            if (picSrcId && header.CoverPicId === picSrcId)
            {
                nextHeader.CoverPicId = nextPhotos[0]?.PicSrcId ?? null;
            }

            return { ...base, SpecMusical: nextHeader, SpecMusicalPictureList: nextPhotos };
        });
    };

    return { remove };
};

const PhotoComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; }) =>
{
    /** 欄位綁定 */
    const setField = useSetTableField<SpecMusicalSet>(prop.formData);
    const cover = useCoverPicSelector(prop.formData);
    const photos = prop.formData.data?.SpecMusicalPictureList ?? [];
    const remover = usePhotoRemove(prop.formData);

    return (
        <>
            {photos.map((item) =>
            {
                const picId = String(item.PicSrcId ?? "");
                const picUrl = FileManagementAPI.get_Server_Preview_Url(item.PicSrcId);
                const rowKeys = { [SpecMusicalPictureListFields.MusicalId]: item.MusicalId, [SpecMusicalPictureListFields.RowId]: item.RowId };

                return (
                    <LibPicture
                        key={`${item.MusicalId}-${item.RowId}`}
                        parentClass="col-xl-3 col-md-4 col-12"
                        ColumnDisplayName="測試"
                        PicSrc={picUrl}
                        PicDescription="文字"
                    >
                        <div className="row">
                            <div className="col-6">
                                <LibCheckBoxSingle
                                    name="coverPic"
                                    checkboxStyle="radio"
                                    options={[{ itemId: picId, itemDisplayName: "選擇封面" }]}
                                    value={cover.selected ? [String(cover.selected)] : []}
                                    onChange={(ids) =>
                                    {
                                        const id = ids?.[0];
                                        if (id)
                                        {
                                            cover.select(id);
                                        }
                                    }}
                                />
                            </div>

                            <div className="col-6 d-flex justify-content-end">
                                <div className="all-btn">
                                    <a
                                        id="trash"
                                        className="icon"
                                        href="#"
                                        onClick={(e) =>
                                        {
                                            e.preventDefault();

                                            if (!window.confirm("確定要刪除這張相片嗎？"))
                                            {
                                                return;
                                            }

                                            remover.remove(String(item.MusicalId ?? ""), Number(item.RowId ?? 0), picId);
                                        }}
                                        title=""
                                        data-bs-toggle="modal"
                                        data-bs-target="#All_Delete"
                                    >
                                        <button
                                            type="button"
                                            className="Itrash btn btn-ctm btn-ctm-rounded"
                                            title=""
                                            data-bs-toggle="tooltip"
                                            data-bs-placement="top"
                                            data-bs-original-title="刪除輪播"
                                        >
                                            <i className="far fa-trash-alt"></i>
                                        </button>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <LibTextBox
                            Style={prop.theme.TextBox2}
                            DefaultInputDisplay="請輸入"
                            {...setField(SpecMusicalSetFields.SpecMusicalPictureList, SpecMusicalPictureListFields.Sort, "number", rowKeys)}
                        />

                        <LibTextBox
                            Style={prop.theme.TextBox2}
                            DefaultInputDisplay="請輸入"
                            {...setField(SpecMusicalSetFields.SpecMusicalPictureList, SpecMusicalPictureListFields.Info, "string", rowKeys)}
                        />
                    </LibPicture>
                );
            })}
        </>
    );
};

const SoundFileComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecMusicalSet>; }) =>
{
    /** 檔案欄位綁定 */
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: SpecMusicalSoundList[] = props.formData.data?.SpecMusicalSoundList ?? [];

    /** 取得排序後附件 */
    const getFiles = (): SpecMusicalSoundList[] =>
    {
        return [...allFiles].sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
    };

    /** 回寫附件清單 */
    const commitFiles = (nextFiles: SpecMusicalSoundList[]) =>
    {
        props.formData.setFormData(prev =>
        {
            const base = prev ?? emptyData;

            return { ...base, SpecMusicalSoundList: nextFiles };
        });
    };

    /** 新增附件 */
    const addFile = () =>
    {
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;

        const newItem: SpecMusicalSoundList = { RowId: nextRowId, SoundSrcId: "", Info: "" };

        commitFiles([...allFiles, newItem]);
    };

    /** 刪除附件 */
    const removeFileAt = (index: number) =>
    {
        const target = getFiles()[index];
        if (!target) return;

        const nextAll = allFiles.filter(file => file.RowId !== target.RowId);
        commitFiles(nextAll);
    };

    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">新增附件</button>

                {getFiles().map((file, index) =>
                {
                    const rowKeys = { [SpecMusicalSoundListFields.MusicalId]: file.MusicalId, [SpecMusicalSoundListFields.RowId]: file.RowId };

                    return (
                        <div key={`${file.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput
                                {...setFileField(
                                    SpecMusicalSetFields.SpecMusicalSoundList,
                                    SpecMusicalSoundListFields.SoundSrcId,
                                    SpecMusicalSoundListFields.Info,
                                    rowKeys,
                                    { defaultNameFromOriginal: "basename", fileName: file.SoundSrc?.FileName ?? "" },
                                )}
                                Accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
                                onDelete={() => removeFileAt(index)}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};
