import { LibCheckBox, LibTextBox, LibTextArea, LibFile, LibDropList, LibPicture, LibFileInput, LibModal, LibPicturePreview } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import SpecUSRProvider from "@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api";
import { useLocation, useParams } from "react-router";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { useGetSpecCategoryListByProgId } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import { useMemo, useState } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { SpecUSRDetailFields, SpecUSRFileFields, SpecUSRModelFields, SpecUSRPhotoFields, SpecUSRPhotoInfoFields, SpecUSRSetFields } from "@/types/SchemaFields";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { LibUrlInput } from "@/SysCore/Components/FormField/FieldComponets/LibUrlInput_Comp";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
type SpecUSRFile = components["schemas"]["SpecUSRFile_DTO"]
type SpecUSRUrl = components["schemas"]["SpecUSRUrl_DTO"]
const emptyData: SpecUSRSet = { SpecUSR: {}, SpecUSRDetail: [], }

/** 網路資源表單
 * @returns 
 */
export const Server_USRProjFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const formData = useFetchFormData<SpecUSRSet>(SpecUSRProvider(), internalId, emptyData)
    const useCategory = useGetSpecCategoryListByProgId("SpecUSR", prop.lang);
    const useTag = useGetTagListByProgId("SpecUSR", prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const status = useMemo(() => { const src = useContentStatus.data ?? {}; const { ["0"]: _drop, ...rest } = src; return rest as Record<string, string>; }, [useContentStatus.data]);
    const actions = useActions(dirUrl, SpecUSRProvider(), formData.data as SpecUSRSet, internalId as string)
    useEnsureLangDetails(formData, { headerName: SpecUSRSetFields.SpecUSR, detailName: SpecUSRSetFields.SpecUSRDetail, parentKeys: [SpecUSRModelFields.USRId], preferFirstLang: prop.lang });
    useEnsureLangDetails(formData, { headerName: SpecUSRSetFields.SpecUSRPhoto, detailName: SpecUSRSetFields.SpecUSRPhotoInfo, parentKeys: [SpecUSRPhotoInfoFields.USRId, SpecUSRPhotoInfoFields.ParentRowId], preferFirstLang: prop.lang });
    const isLoading = [formData.isLoading, useCategory.isLoading, useTag.isLoading, useContentStatus.isLoading]
    const errors = [formData.error, useCategory.error, useTag.error, useContentStatus.error]

    const selectedCateId = formData?.data?.SpecUSR?.CategoryId ?? "";
    const visibleCols = useMemo(() => {
        const list = useCategory.cols?.[selectedCateId] ?? [];
        return new Set(list);
    }, [selectedCateId, useCategory.cols]);


    const formProp: FormCompProp = { Title: "新增USR計畫", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={status} tagOpts={useTag.data} />
            <DetailComp theme={prop.theme} formData={formData} visibleCols={visibleCols} />
        </FormComp>
    )
}

const HeaderComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<SpecUSRSet>(prop.formData);
    const useUploadPic = useUploadPicture();
    const initialPicId = prop.formData.data?.SpecUSR?.PictureId;
    const previewSrc = useUploadPic.result.previewUrl || (initialPicId ? `${FileManagementAPI.PREVIEW_URL}/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");
    const LibTabsPropA: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Img": "封面圖片", "Photo": "相片" }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibDropList Style={prop.theme.DropList} Options={prop.cateOpts} {...setField(SpecUSRSetFields.SpecUSR, SpecUSRModelFields.CategoryId, 'string')} />],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SpecUSRSetFields.SpecUSR, SpecUSRModelFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SpecUSRSetFields.SpecUSR, SpecUSRModelFields.Tags, 'string', undefined, 'csv')} />],
        Img: [
            <LibFile Style={prop.theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}
                InputValue={""}
                accept="image/*"
                parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                onChange={(files) =>
                    useUploadPic.handleFileChange(files, (internalId) => {
                        prop.formData.setFormData((prev) => ({ ...prev, SpecUSR: { ...prev?.SpecUSR, PictureId: internalId, }, }));
                    })
                }>
                <LibPicture key="preview" ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""} PicSrc={previewSrc} PicDescription={`選中的圖片`} />
            </LibFile>,
            <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSR, SpecUSRModelFields.PicDescription, 'string')} />
        ],
        Photo: [<UploadPicComp theme={prop.theme} formData={prop.formData} />, <PhotoComp theme={prop.theme} formData={prop.formData} />]
    }
    return (<TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>)
}

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet>; visibleCols: Set<string>; }) => {
    const setField = useSetTableField<SpecUSRSet>(prop.formData);
    const rawDetails = prop.formData.data?.SpecUSRDetail ?? [];

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.USRId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }

    // ★ 1) 定義欄位呈現順序（鍵名需與 ShowColumnItems 內的代碼一致）
    const orderedKeys = [SpecUSRDetailFields.Year, SpecUSRDetailFields.AcademicYear, SpecUSRDetailFields.Courses,
    SpecUSRDetailFields.PracticeField, SpecUSRDetailFields.ProjectName, SpecUSRDetailFields.ExternalCooperationUnit,
    SpecUSRDetailFields.ProjectItem, SpecUSRDetailFields.Department, SpecUSRDetailFields.DuringExecution,
    SpecUSRDetailFields.PlanAmount, SpecUSRDetailFields.ExecutionStrategy, SpecUSRDetailFields.ContentIntroduction,
    SpecUSRDetailFields.ProjectConcept, SpecUSRDetailFields.ProjectHighlights, SpecUSRDetailFields.ProjectLeader,
    SpecUSRDetailFields.ProjectSubLeader,
    SpecUSRDetailFields.Cohost1, SpecUSRDetailFields.Cohost2, SpecUSRDetailFields.Commissioned,
    SpecUSRDetailFields.AttendTeam,
    SpecUSRDetailFields.Remark, SpecUSRDetailFields.Url, SpecUSRDetailFields.UrlDescription] as const;
    type FieldKey = typeof orderedKeys[number];

    // ★ 2) 產生各欄位的 node 工廠（避免用 function 宣告）
    const makeNodes = (rowKeys: Record<string, any>) => {
        const nodes: Record<FieldKey, React.ReactNode> = {
            Year: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Year, "string", rowKeys)} />,
            AcademicYear: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AcademicYear, "number", rowKeys)} />,
            Courses: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Courses, "string", rowKeys)} />,
            PracticeField: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PracticeField, "string", rowKeys)} />,
            ProjectName: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectName, "string", rowKeys)} />,
            ExternalCooperationUnit: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit, "string", rowKeys)} />,
            ProjectItem: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectItem, "string", rowKeys)} />,
            Department: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Department, "string", rowKeys)} />,
            DuringExecution: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.DuringExecution, "string", rowKeys)} />,
            PlanAmount: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PlanAmount, "number", rowKeys)} />,
            ExecutionStrategy: <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExecutionStrategy, "string", rowKeys)} />,
            ContentIntroduction: <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ContentIntroduction, "string", rowKeys)} />,
            ProjectConcept: <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectConcept, "string", rowKeys)} />,
            ProjectHighlights: <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectHighlights, "string", rowKeys)} />,
            ProjectLeader: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectLeader, "string", rowKeys)} />,
            ProjectSubLeader: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectSubLeader, "string", rowKeys)} />,
            Cohost1: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost1, "string", rowKeys)} />,
            Cohost2: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost2, "string", rowKeys)} />,
            Commissioned: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Commissioned, "string", rowKeys)} />,
            AttendTeam: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AttendTeam, "string", rowKeys)} />,
            Remark: <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Remark, "string", rowKeys)} />,
            Url: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Url, "string", rowKeys)} />,
            UrlDescription: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.UrlDescription, "string", rowKeys)} />,
        };
        return nodes;
    };

    // ★ 3) 按可視欄位集合篩選並產生 tabContent
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info, idx) => {
            const detailRowId = info.RowId ?? idx;
            const langKey = LibMerge("_", true, info.USRId, info.RowId, info.Lang)
            const rowKeys = { [SpecUSRDetailFields.USRId]: info.USRId, [SpecUSRDetailFields.RowId]: info.RowId, };
            const nodes = makeNodes(rowKeys);
            const showAll = prop.visibleCols.size === 0;
            const list = orderedKeys.filter(k => showAll || prop.visibleCols.has(k)).map(k => nodes[k]);

            const extras: React.ReactNode[] = [
                <DividerComp key={`${langKey}-div-1`} />,
                <SubFilesComp key={`${langKey}-files`} theme={prop.theme} formData={prop.formData} parentRowId={detailRowId} />,
                <DividerComp key={`${langKey}-div-2`} />,
                <SubUrlComp key={`${langKey}-url`} theme={prop.theme} formData={prop.formData} parentRowId={detailRowId} />,
            ];

            compMap[langKey] = list;
            compMap[langKey] = [...list, ...extras];
            return compMap;
        }, {}
    );

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

const SubFilesComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet>; parentRowId: number }) => {
    const setFileField = useSetTableFileField(prop.formData);
    const allFiles: SpecUSRFile[] = prop.formData.data?.SpecUSRFile ?? [];
    const getFiles = (): SpecUSRFile[] => allFiles.filter(f => f.ParentRowId === prop.parentRowId).sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: SpecUSRFile[]) => {
        prop.formData.setFormData(prev => ({
            ...(prev ?? { SpecUSR: {}, SpecUSRDetail: [], SpecUSRFile: [], SpecUSRUrl: [], SpecUSRPhoto: [], SpecUSRPhotoInfo: [] }),
            SpecUSRFile: nextFiles,
        }));
    };
    // 新增一筆附件列
    const addFile = () => {
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: SpecUSRFile = { ParentRowId: prop.parentRowId, RowId: nextRowId, FileSrcId: "", FileName: "", };
        commitFiles([...allFiles, newItem]);
    };

    // 刪除第 i 筆附件列
    const removeFileAt = (i: number) => {
        const filtered = getFiles();
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.ParentRowId === target.ParentRowId && f.RowId === target.RowId));
        commitFiles(nextAll);
    };
    return (
        <>
            {"檔案上傳"}
            <div role="group" className="mt-4">
                {getFiles().map((f, i) => {
                    const rowKeys = { [SpecUSRFileFields.USRId]: f.USRId, [SpecUSRFileFields.ParentRowId]: f.ParentRowId, [SpecUSRFileFields.RowId]: f.RowId, }
                    return (
                        <div key={`${f.ParentRowId}-${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput Style={prop.theme.FileInput} DefaultInputDisplay="請輸入附件說明" Accept="*/*" onDelete={() => removeFileAt(i)}
                                {...setFileField(SpecUSRSetFields.SpecUSRFile, SpecUSRFileFields.FileSrcId, SpecUSRFileFields.FileName, rowKeys,)} />
                        </div>
                    )
                })}
                <div className="row mx-0">
                    <div className="col form-group">
                        <div className="row mx-0">
                            <div className="col-sm-10 offset-sm-2 float-md-left float-sm-none">
                                <button data-repeater-create="" type="button" className="btn btn-custom btn-rounded btn-sm mr-2 my-2" onClick={addFile} aria-label={"新增"} >
                                    <i className="far fa-plus mr-2"></i>{"新增"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

const SubUrlComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet>; parentRowId: number }) => {
    const allUrls: SpecUSRUrl[] = prop.formData.data?.SpecUSRUrl ?? [];
    const handleChangeAll = (nextAll: SpecUSRUrl[]) => {
        prop.formData.setFormData(prev => ({
            ...(prev ?? { SpecUSR: {}, SpecUSRDetail: [], SpecUSRFile: [], SpecUSRUrl: [], SpecUSRPhoto: [], SpecUSRPhotoInfo: [] }),
            SpecUSRUrl: nextAll,
        }));
    };
    return (
        <LibUrlInput<SpecUSRUrl>
            items={allUrls}
            onChange={handleChangeAll}
            parentValue={prop.parentRowId}
            fields={{
                parentRowId: "ParentRowId",
                rowId: "RowId",
                title: "UrlDescription",
                url: "Url",
                target: "WindowTarget",
            }}
            label="外部連結"
            targets={{ 0: "本頁開啟", 1: "另開分頁" }}
            getDefault={({ rowId, parentValue }) => ({
                RowId: rowId,
                ParentRowId: parentValue,
                UrlDescription: "",
                Url: "",
                WindowTarget: 0,
            })}
        />
    );
};

const UploadPicComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet> }) => {
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
    const appendPhotosToForm = (picIds: string[]) => {
        prop.formData.setFormData(prev => {
            const draft: any = { ...(prev ?? {}) };
            const header = draft[SpecUSRSetFields.SpecUSR] ?? {};
            const usrId = header[SpecUSRModelFields.USRId] ?? "";
            const list = draft[SpecUSRSetFields.SpecUSRPhoto] ?? [];
            const base = (list as any[]).reduce((m, it) => it?.[SpecUSRPhotoFields.USRId] === usrId ? Math.max(m, Number(it?.[SpecUSRPhotoFields.RowId] || 0)) : m, 0);
            const newItems = picIds.map((pid, i) => ({
                [SpecUSRPhotoFields.USRId]: usrId,
                [SpecUSRPhotoFields.RowId]: base + i + 1,
                [SpecUSRPhotoFields.PicSrcId]: pid,
                // 方便排序：預設用 RowId
                [SpecUSRPhotoFields.Sort]: base + i + 1,
            }));
            draft[SpecUSRSetFields.SpecUSRPhoto] = [...list, ...newItems];
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
const PhotoComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet>; }) => {
    const setField = useSetTableField<SpecUSRSet>(prop.formData);
    const photos = prop.formData?.data?.SpecUSRPhoto ?? []
    const remover = usePhotoRemove(prop.formData);

    const dom =
        (<>
            {photos.map((item) => {
                const rowKeys = { [SpecUSRPhotoFields.USRId]: item.USRId, [SpecUSRPhotoFields.RowId]: item.RowId }
                return (
                    <LibPicture parentClass="col-xl-3 col-md-4 col-12" ColumnDisplayName="測試" PicSrc={`${FileManagementAPI.PREVIEW_URL}/${item.PicSrcId}`} PicDescription="文字">
                        <div className="row">
                            <div className="col-6 d-flex justify-content-end">
                                <div className="all-btn">
                                    <a id="trash" className="icon" href="#" onClick={() => {
                                        if (!window.confirm('確定要刪除這張相片嗎？')) return;
                                        remover.remove(String(item.USRId ?? ''), Number(item.RowId ?? 0));
                                    }} title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                                        <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                                            <i className="far fa-trash-alt"></i>
                                        </button>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <LibTextBox Style={prop.theme.TextBox2} DefaultInputDisplay={"請輸入"}  {...setField(SpecUSRSetFields.SpecUSRPhoto, SpecUSRPhotoFields.Sort, "number", rowKeys)} />
                        <PhotoInfoComp theme={prop.theme} formData={prop.formData} parentRowId={item.RowId ?? 0} />
                    </LibPicture>
                )
            })}
        </>)
    return (dom)
}
const usePhotoRemove = (formData: UseFetchFormDataResult<SpecUSRSet>) => {
    const remove = (usrId?: string, rowId?: number) => {
        if (!usrId || rowId == null) return;
        formData.setFormData(prev => {
            // 以完整結構為基礎，確保提交資料「真的」更新
            const base: SpecUSRSet = prev ?? { SpecUSR: {}, SpecUSRDetail: [], SpecUSRFile: [], SpecUSRUrl: [], SpecUSRPhoto: [], SpecUSRPhotoInfo: [] };
            const photos = base.SpecUSRPhoto ?? [];
            const details = base.SpecUSRPhotoInfo ?? [];
            const nextPhotos = photos.filter(p => !(p?.USRId === usrId && p?.RowId === rowId));
            const nextDetails = details.filter(d => !(d?.USRId === usrId && d?.ParentRowId === rowId));
            // 如果刪到目前封面，換成剩下第一張；沒有就清空
            const header = base.SpecUSR ?? {};
            const nextHeader = { ...header };
            // 以「整份物件」方式提交，確保資料狀態一致（與 Announcement 附件刪除相同風格）
            return {
                ...base,
                SpecUSR: nextHeader,
                SpecUSRPhoto: nextPhotos,
                SpecUSRPhotoInfo: nextDetails,
            };
        });
    };
    return { remove };
};
const PhotoInfoComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet>; parentRowId: number }) => {
    const setField = useSetTableField<SpecUSRSet>(prop.formData);
    const rawDetails = prop.formData.data?.SpecUSRPhotoInfo?.filter(p => p.ParentRowId === prop.parentRowId) ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.USRId, info.ParentRowId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.USRId, info.ParentRowId, info.RowId, info.Lang)
            const rowKeys = { [SpecUSRPhotoInfoFields.USRId]: info.USRId, [SpecUSRPhotoInfoFields.ParentRowId]: info.ParentRowId, [SpecUSRPhotoInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [<LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRPhotoInfo, SpecUSRPhotoInfoFields.Title, "string", rowKeys)} />,]
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}