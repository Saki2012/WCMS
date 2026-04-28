import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import {
    LibCheckBox,
    LibDropList,
    LibFile,
    LibModal,
    LibPicture,
    LibPicturePreview,
    LibTextBox,
    LibTinyMCE,
} from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { MaterialFields, MaterialLangInfoFields, MaterialPictureFields, MaterialSetFields } from "@/types/SchemaFields";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMaterialFormFetchData } from "./Server_Material_Form_Hook";

type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type MaterialPicture = components["schemas"]["MaterialPicture_DTO"];
type MaterialTags = components["schemas"]["MaterialTags_DTO"];
type InfoField = components["schemas"]["MatCategoryInfoField_DTO"];
type InfoFieldDisplay = components["schemas"]["MatCategoryInfoFieldDisplay_DTO"];
type MaterialInfoJson = Record<string, string>;

interface InfoFieldKeySource extends InfoField
{
    Field?: string | null;
    FieldKey?: string | null;
    FieldName?: string | null;
}

interface MaterialInfoFieldItem
{
    Field: string;
    Title: string;
}
type MaterialUploadError = Error & { status?: number; };
type MaterialUploadJson = { Data?: string[]; };

/** 建立空白資料 */
const buildEmptyData = (): MaterialSet =>
{
    return { Material: {}, MaterialLangInfo: [], MaterialPicture: [], MaterialTags: [] };
};

/** 建立語系 tab key */
const buildLangTabKey = (lang: Lang | string): string =>
{
    return LibMerge("_", false, "Lang", lang);
};

/** 取得下一個 RowId */
const getNextRowId = <T extends { RowId?: number | null; }>(rows: T[]): number =>
{
    return rows.reduce((m, item) => Math.max(m, item.RowId ?? 0), 0) + 1;
};

/** 取得物件資訊 JSON 欄位 key */
const getInfoFieldKey = (field: InfoField): string =>
{
    const data = field as InfoFieldKeySource;
    return String(data.Field ?? data.FieldKey ?? data.FieldName ?? field.RowId ?? "");
};

/** 取得目前已選標籤 Id */
const getSelectedTagIds = (formData: UseFetchFormDataResult<MaterialSet>): string[] =>
{
    return (formData.data?.MaterialTags ?? []).map(x => String(x.TagId ?? "").trim()).filter(Boolean);
};

/** 加入一筆標籤 detail */
const addTagDetail = (formData: UseFetchFormDataResult<MaterialSet>, tagId: string): void =>
{
    const nextTagId = String(tagId ?? "").trim();
    if (!nextTagId) return;

    formData.setFormData(prev =>
    {
        const base = prev ?? buildEmptyData();
        const rows = base.MaterialTags ?? [];
        const exists = rows.some(x => String(x.TagId ?? "").trim() === nextTagId);
        if (exists) return base;

        const row: MaterialTags = { MaterialId: base.Material?.MaterialId ?? "", RowId: getNextRowId(rows), TagId: nextTagId };

        return { ...base, MaterialTags: [...rows, row] };
    });
};
/** 移除指定 TagId 的 detail */
const removeTagDetailByTagId = (formData: UseFetchFormDataResult<MaterialSet>, tagId: string): void =>
{
    const nextTagId = String(tagId ?? "").trim();
    if (!nextTagId) return;

    formData.setFormData(prev =>
    {
        const base = prev ?? buildEmptyData();
        return { ...base, MaterialTags: (base.MaterialTags ?? []).filter(x => String(x.TagId ?? "").trim() !== nextTagId) };
    });
};

/** 切換標籤勾選 */
const toggleTagDetail = (formData: UseFetchFormDataResult<MaterialSet>, tagId: string, checked: boolean): void =>
{
    if (checked)
    {
        addTagDetail(formData, tagId);
        return;
    }

    removeTagDetailByTagId(formData, tagId);
};

/** 取得欄位顯示名稱：目前語系 -> 系統語系 -> 【Field】 */
const getInfoFieldTitle = (field: InfoField, lang: Lang, systemLang: Lang): string =>
{
    const rowId = String(field.RowId ?? "");
    const fieldKey = getInfoFieldKey(field);
    const sameField = field._MatCategoryInfoFieldDisplay?.filter(x => String(x.ParentRowId) === rowId) ?? [];

    const current = sameField.find(x => String(x.Lang) === String(lang))?.FieldDisplayName;
    if (current) return current;

    const fallback = sameField.find(x => String(x.Lang) === String(systemLang))?.FieldDisplayName;
    if (fallback) return fallback;

    return `【${fieldKey}】`;
};

/** 建立 MaterialInfoJson 預設物件 */
const buildMaterialInfoDefaults = (fields: InfoField[]): MaterialInfoJson =>
{
    return (fields ?? []).reduce<MaterialInfoJson>((map, field) =>
    {
        const key = getInfoFieldKey(field);
        if (!key) return map;
        map[key] = "";
        return map;
    }, {});
};

/** 刪除圖片列 */
const removePictureRow = (formData: UseFetchFormDataResult<MaterialSet>, rowId?: number | null): void =>
{
    if (rowId == null) return;

    formData.setFormData(prev =>
    {
        const base = prev ?? buildEmptyData();
        return { ...base, MaterialPicture: (base.MaterialPicture ?? []).filter(x => x.RowId !== rowId) };
    });
};

export const Server_Material_Form_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const emptyData = useMemo(() => buildEmptyData(), []);

    /** 返回列表 */
    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const getData = useMaterialFormFetchData({ lang: prop.lang, internalId: internalId ?? "", emptyData, actionsOpt: { onBackToList } });

    /** 自動補語系明細 */
    useEnsureLangDetails(getData.rawData.formData, {
        headerName: MaterialSetFields.Material,
        detailName: MaterialSetFields.MaterialLangInfo,
        parentKeys: [MaterialFields.MaterialId],
        preferFirstLang: prop.lang,
    });

    const propForm: FormCompProp = {
        Title: internalId ? `修改${prop.title}` : `新增${prop.title}`,
        Theme: prop.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };

    return (
        <FormComp prop={propForm}>
            <MaterialBodyComp
                theme={prop.theme}
                formData={getData.rawData.formData}
                lang={prop.lang}
                categoryMap={getData.rawData.categoryMap}
                tagMap={getData.rawData.tagMap}
                infoFields={getData.rawData.infoFields}
                infoFieldDisplays={getData.rawData.infoFieldDisplays}
                systemLang={prop.lang}
            />
        </FormComp>
    );
};

/** 主體 tab 區塊 */
const MaterialBodyComp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<MaterialSet>;
        lang: Lang;
        categoryMap: Record<string, string>;
        tagMap: Record<string, string>;
        infoFields: InfoField[];
        infoFieldDisplays: InfoFieldDisplay[];
        systemLang: Lang;
    },
) =>
{
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { Basic: "基本資料", Picture: "物件照片", System: "系統資訊" } };

    const tabContent: Record<string, ReactNode[]> = {
        Basic: [
            <MaterialBasicEditorComp
                key="Basic"
                theme={prop.theme}
                formData={prop.formData}
                categoryMap={prop.categoryMap}
                tagMap={prop.tagMap}
                infoFields={prop.infoFields}
                infoFieldDisplays={prop.infoFieldDisplays}
                systemLang={prop.systemLang}
            />,
        ],
        Picture: [<MaterialPictureEditorComp key="Picture" theme={prop.theme} formData={prop.formData} />],

        System: [<SystemInfoTabComp key="System" theme={prop.theme} formData={prop.formData} setKey={MaterialSetFields.Material} />],
    };

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

/** 基本資料編輯區 */
const MaterialBasicEditorComp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<MaterialSet>;
        categoryMap: Record<string, string>;
        tagMap: Record<string, string>;
        infoFields: InfoField[];
        infoFieldDisplays: InfoFieldDisplay[];
        systemLang: Lang;
    },
) =>
{
    const setField = useSetTableField<MaterialSet>(prop.formData);

    /** 類別下拉選項 */
    const categoryOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(prop.categoryMap ?? {}));
    }, [prop.categoryMap]);

    return (
        <>
            <LibDropList
                Style={prop.theme.DropList}
                Options={categoryOpts}
                AutoDefaultFirst={false}
                {...setField(MaterialSetFields.Material, MaterialFields.CategoryId, "string")}
            />

            <MaterialTagEditorComp key="Tag" theme={prop.theme} formData={prop.formData} tagMap={prop.tagMap} />

            <MaterialLangEditorComp
                key="Lang"
                theme={prop.theme}
                formData={prop.formData}
                infoFields={prop.infoFields}
                infoFieldDisplays={prop.infoFieldDisplays}
                systemLang={prop.systemLang}
            />
        </>
    );
};

/** 語系 tab 區塊 */
const MaterialLangEditorComp = (
    prop: { theme: IBETheme; formData: UseFetchFormDataResult<MaterialSet>; infoFields: InfoField[]; infoFieldDisplays: InfoFieldDisplay[]; systemLang: Lang; },
) =>
{
    const rows = prop.formData.data?.MaterialLangInfo ?? [];

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rows.reduce<Record<string, string>>((map, item) =>
        {
            const key = buildLangTabKey(item.Lang as Lang);
            map[key] = LangLabelMap[item.Lang as Lang] ?? String(item.Lang ?? "Unknown");
            return map;
        }, {}),
    };

    const tabContent = rows.reduce<Record<string, ReactNode[]>>((map, item) =>
    {
        const key = buildLangTabKey(item.Lang as Lang);
        map[key] = [
            <MaterialLangItemComp
                key={key}
                theme={prop.theme}
                formData={prop.formData}
                rowId={item.RowId}
                lang={item.Lang as Lang}
                systemLang={prop.systemLang}
                infoFields={prop.infoFields}
                infoFieldDisplays={prop.infoFieldDisplays}
            />,
        ];
        return map;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

/** 單一語系內容區 */
const MaterialLangItemComp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<MaterialSet>;
        rowId?: number | null;
        lang: Lang;
        systemLang: Lang;
        infoFields: InfoField[];
        infoFieldDisplays: InfoFieldDisplay[];
    },
) =>
{
    const setField = useSetTableField<MaterialSet>(prop.formData);
    const rowKeys = useMemo(() => ({ [MaterialLangInfoFields.RowId]: prop.rowId }), [prop.rowId]);

    return (
        <div className="row g-3">
            <LibTextBox
                Style={prop.theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(MaterialSetFields.MaterialLangInfo, MaterialLangInfoFields.MaterialName, "string", rowKeys)}
            />
            {/* 價格之後要搬到"商品"模塊，暫時先放在這 */}
            <LibTextBox Style={prop.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(MaterialSetFields.Material, MaterialFields.Price, "number")} />

            <MaterialInfoJsonEditorComp
                theme={prop.theme}
                formData={prop.formData}
                rowId={prop.rowId}
                lang={prop.lang}
                systemLang={prop.systemLang}
                infoFields={prop.infoFields}
                infoFieldDisplays={prop.infoFieldDisplays}
            />

            <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(MaterialSetFields.MaterialLangInfo, MaterialLangInfoFields.Memo, "string", rowKeys)} />
        </div>
    );
};

/** 動態物件資訊 JSON 編輯器 */
const MaterialInfoJsonEditorComp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<MaterialSet>;
        rowId?: number | null;
        lang: Lang;
        systemLang: Lang;
        infoFields: InfoField[];
        infoFieldDisplays: InfoFieldDisplay[];
    },
) =>
{
    const rowKeys = useMemo(() => ({ [MaterialLangInfoFields.RowId]: prop.rowId }), [prop.rowId]);

    /** 建立 JSON 預設值 */
    const defaults = useMemo(() =>
    {
        return buildMaterialInfoDefaults(prop.infoFields);
    }, [prop.infoFields]);

    const binder = useSetJsonField<MaterialSet, MaterialInfoJson>(
        prop.formData,
        MaterialSetFields.MaterialLangInfo,
        MaterialLangInfoFields.MaterialInfoJson,
        rowKeys,
        defaults,
    );

    /** 建立動態欄位列表 */
    const items = useMemo<MaterialInfoFieldItem[]>(() =>
    {
        return (prop.infoFields ?? []).map(field =>
        {
            const key = getInfoFieldKey(field);
            return { Field: key, Title: getInfoFieldTitle(field, prop.lang, prop.systemLang) };
        });
    }, [prop.infoFields, prop.infoFieldDisplays, prop.lang, prop.systemLang]);

    if (items.length === 0)
    {
        return <div className="text-muted">請先選擇類別，系統會自動帶入可設定欄位。</div>;
    }

    return (
        <div className="row g-3">
            {items.map(item =>
            {
                const bind = binder.bind(item.Field as keyof MaterialInfoJson, "string");

                return (
                    <LibTextBox
                        key={`MaterialInfo_${prop.rowId}_${item.Field}`}
                        Style={prop.theme.TextBox3}
                        ColumnDisplayName={item.Title}
                        DefaultInputDisplay={`請輸入${item.Title}`}
                        InputValue={String(bind.value ?? "")}
                        OnChange={bind.onChange}
                    />
                );
            })}
        </div>
    );
};
/** 將上傳完成的圖片寫入 MaterialPicture */
const appendMaterialPicturesToForm = (formData: UseFetchFormDataResult<MaterialSet>, picIds: string[], fileNames: string[]): void =>
{
    formData.setFormData(prev =>
    {
        const base = prev ?? buildEmptyData();
        const materialId = base.Material?.MaterialId ?? "";
        const rows = base.MaterialPicture ?? [];
        const baseRowId = getNextRowId(rows) - 1;

        const newRows: MaterialPicture[] = picIds.map((picId, index) => ({
            MaterialId: materialId,
            RowId: baseRowId + index + 1,
            PictureId: picId,
            PictureName: fileNames[index] ?? "",
        }));

        return { ...base, MaterialPicture: [...rows, ...newRows] };
    });
};
/** 物件照片上傳視窗 */
const UploadMaterialPictureComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<MaterialSet>; }) =>
{
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** 單檔上傳 */
    const uploadOne = useCallback(async (file: File, fieldName: "file" | "files"): Promise<MaterialUploadJson> =>
    {
        const fd = new FormData();
        fd.append(fieldName, file, file.name);

        const resp = await fetch(FileManagementAPI.Server_UploadTemp, { method: "POST", body: fd, credentials: "include", mode: "cors" });

        if (!resp.ok)
        {
            const text = await resp.text().catch(() => "");
            const err: MaterialUploadError = new Error(`Upload ${file.name} failed: ${resp.status} ${text}`);
            err.status = resp.status;
            throw err;
        }

        return (await resp.json().catch(() => ({}))) as MaterialUploadJson;
    }, []);

    /** 批次上傳 */
    const uploadAll = useCallback(async (): Promise<string[]> =>
    {
        const results: string[] = [];

        for (const file of selectedFiles)
        {
            let json: MaterialUploadJson;

            try
            {
                json = await uploadOne(file, "file");
            } catch (e)
            {
                const err = e as MaterialUploadError;
                if ((err?.status ?? 0) !== 400) throw err;
                json = await uploadOne(file, "files");
            }

            const id = json.Data?.[0];
            if (!id) throw new Error(`Upload ${file.name}: missing InternalId`);
            results.push(String(id));
        }

        return results;
    }, [selectedFiles, uploadOne]);

    /** 確認上傳 */
    const handleUpload = useCallback(async () =>
    {
        if (selectedFiles.length === 0 || isUploading) return;

        try
        {
            setError(null);
            setIsUploading(true);

            const picIds = await uploadAll();
            appendMaterialPicturesToForm(prop.formData, picIds, selectedFiles.map(p => p.name));

            setSelectedFiles([]);
        } catch (e)
        {
            const err = e as Error;
            setError(err?.message ?? String(err));
            throw err;
        } finally
        {
            setIsUploading(false);
        }
    }, [isUploading, prop.formData, selectedFiles, uploadAll]);

    return (
        <LibModal
            ModalName="上傳物件照片"
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
/** 物件照片編輯區 */
const MaterialPictureEditorComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<MaterialSet>; }) =>
{
    const rows = prop.formData.data?.MaterialPicture ?? [];
    const setField = useSetTableField<MaterialSet>(prop.formData);

    return (
        <>
            <UploadMaterialPictureComp theme={prop.theme} formData={prop.formData} />

            <div className="row g-3">
                {rows.map(item =>
                {
                    const picId = String(item.PictureId ?? "");
                    const picUrl = picId ? FileManagementAPI.get_Public_Preview_Url(picId) : "";
                    const rowKeys = { [MaterialPictureFields.RowId]: item.RowId };

                    return (
                        <LibPicture
                            key={`Picture_${item.RowId}`}
                            parentClass="col-xl-3 col-md-4 col-12"
                            ColumnDisplayName={item.PictureName || `照片 ${item.RowId ?? ""}`}
                            PicSrc={picUrl}
                            PicDescription={item.PictureName || `物件照片 ${item.RowId ?? ""}`}
                        >
                            <div className="row">
                                <div className="col-12 d-flex justify-content-end">
                                    <div className="all-btn">
                                        <a
                                            id={`trash_${item.RowId}`}
                                            className="icon"
                                            href="#"
                                            onClick={(e) =>
                                            {
                                                e.preventDefault();
                                                if (!window.confirm("確定要刪除這張照片嗎？"))
                                                {
                                                    return;
                                                }
                                                removePictureRow(prop.formData, item.RowId);
                                            }}
                                            title=""
                                        >
                                            <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="刪除照片">
                                                <i className="far fa-trash-alt"></i>
                                            </button>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <LibTextBox
                                Style={prop.theme.TextBox2}
                                DefaultInputDisplay="請輸入照片名稱"
                                {...setField(MaterialSetFields.MaterialPicture, MaterialPictureFields.PictureName, "string", rowKeys)}
                            />

                            <LibTextBox
                                Style={prop.theme.TextBox2}
                                DefaultInputDisplay="請輸入圖片 InternalId"
                                {...setField(MaterialSetFields.MaterialPicture, MaterialPictureFields.PictureId, "string", rowKeys)}
                            />
                        </LibPicture>
                    );
                })}
            </div>
        </>
    );
};
/** 標籤編輯區 */
const MaterialTagEditorComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<MaterialSet>; tagMap: Record<string, string>; }) =>
{
    const selectedTagIds = useMemo(() =>
    {
        return getSelectedTagIds(prop.formData);
    }, [prop.formData.data?.MaterialTags]);

    return (
        <LibCheckBox
            Style={prop.theme.CheckBox}
            ColumnDisplayName="標籤"
            options={prop.tagMap}
            InputValue={selectedTagIds}
            onChange={(v) =>
            {
                const nextIds = Array.isArray(v)
                    ? v.map(x => String(x ?? "").trim()).filter(Boolean)
                    : [];

                const prevIds = getSelectedTagIds(prop.formData);
                const prevSet = new Set(prevIds);
                const nextSet = new Set(nextIds);

                prevIds.filter(id => !nextSet.has(id)).forEach(id =>
                {
                    toggleTagDetail(prop.formData, id, false);
                });

                nextIds.filter(id => !prevSet.has(id)).forEach(id =>
                {
                    toggleTagDetail(prop.formData, id, true);
                });
            }}
        />
    );
};
