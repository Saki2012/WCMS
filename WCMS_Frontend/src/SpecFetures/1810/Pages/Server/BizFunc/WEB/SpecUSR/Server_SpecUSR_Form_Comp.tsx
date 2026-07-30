import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { LibPicture, useUploadPicture } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibPicture_Comp";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibUrlInput } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibUrlInput_Comp";
import { LibCheckBox, LibDropList, LibFile, LibFileInput, LibModal, LibPicturePreview, LibTextArea, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import {
    type FormDataLike,
    useFormModelField,
    useSetTableField,
    useSetTableFileField,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { PreviewFrame } from "@/Features/Pages/Server/Scaffold/Preview/PreviewFrame";
import { buildServerPreviewToolbarButton, useServerPreviewFrame } from "@/Features/Pages/Server/Scaffold/Preview/PreviewFrame_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { PGID, SpecUSRDetailFields, SpecUSRFileFields, SpecUSRFields, SpecUSRPhotoFields, SpecUSRPhotoInfoFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    SpecUSRAttachmentUploadLimit,
    SpecUSRPhotoBatchUploadLimit,
    SpecUSRPictureUploadLimit,
    specUSREmptyData,
    useSpecUSRFormTemplate,
} from "./Server_SpecUSR_Form_Hook";
import { LibAttachment, LibText } from "@/SysCore/Utils/Library/LibData";

// #region Property
type SpecUSRFormModel = components["schemas"]["SpecUSR"];

type SpecUSRPreviewPayload = {
    type: "wcms:preview";
    module: "specUSR";
    payload: {
        kind: "dto";
        dto: SpecUSRFormModel;
    };
};

type SpecUSRDetail = NonNullable<SpecUSRFormModel["_SpecUSRDetail"]>[number];

type SpecUSRFile = NonNullable<SpecUSRDetail["_SpecUSRFile"]>[number];

type SpecUSRUrl = NonNullable<SpecUSRDetail["_SpecUSRUrl"]>[number];

type SpecUSRPhoto = NonNullable<SpecUSRFormModel["_SpecUSRPhoto"]>[number];

type SpecUSRPhotoInfo = NonNullable<SpecUSRPhoto["_SpecUSRPhotoInfo"]>[number];

type SpecUSRFormBinding = ServerFormBinding<SpecUSRFormModel>;

type UploadPictureHandler = ReturnType<typeof useUploadPicture>["handleFileChange"];
// #endregion

// #region Public
/** 網路資源表單
 * @returns
 */
export const Server_USRProjFormComp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const preview = useServerPreviewFrame<SpecUSRPreviewPayload>({ ProgId: PGID.SpecUSR });
    const onBackToList = useCallback(() =>
    {
        const listPath = LibRoutePath.buildServerBackToListPath(pathname);
        markPageStateMemoryEntry(listPath, "normalize");
        navigate(listPath, { replace: true });
    }, [navigate, pathname]);
    const actionsOpt = useMemo(() =>
    {
        return { onBackToList, onPreviewFromDto: preview.openPreview };
    }, [onBackToList, preview.openPreview]);
    const template = useSpecUSRFormTemplate({ lang: prop.lang, theme: prop.theme, internalId: internalId ?? "", emptyData: specUSREmptyData, actionsOpt });

    return (
        <Server_FormTemplate_Comp
            template={template}
            resolveActionToolbarButtons={({ vm }) => [
                buildServerPreviewToolbarButton({ action: vm.actions.Preview }),
            ]}
            renderContent={({ vm }) => (
                <>
                    <HeaderComp theme={prop.theme} formData={vm.binding} cateOpts={new Map<string, string>(Object.entries(vm.refs.categoryMap ?? {}))} statusOpts={vm.refs.statusOpts} tagOpts={vm.refs.tagMap} />
                    <DetailComp theme={prop.theme} formData={vm.binding} visibleCols={getVisibleCols(vm.binding, vm.refs.categoryCols)} />
                    <PreviewFrame
                        open={preview.isOpen}
                        siteIndex={preview.siteIndex}
                        onClose={preview.closePreview}
                        payload={preview.framePayload}
                        title={preview.title}
                    />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
const HeaderComp = (
    prop: {
        theme: IBETheme;
        formData: SpecUSRFormBinding;
        cateOpts: Map<string, string>;
        statusOpts: Record<string, string>;
        tagOpts: Record<string, string>;
    },
) =>
{
    const setField = useFormModelField<SpecUSRFormModel>(prop.formData);
    const useUploadPic = useUploadPicture();
    const [pictureInputResetKey, setPictureInputResetKey] = useState(0);
    const initialPicId = prop.formData.data?.PictureId;
    const hasPicture = hasSpecUSRPicture(useUploadPic.result.previewUrl, initialPicId);
    const previewSrc = buildSpecUSRPicturePreviewSrc(useUploadPic.result.previewUrl, initialPicId);
    const handleRemovePicture = useCallback(() =>
    {
        handleSpecUSRPictureRemove(prop.formData, useUploadPic.handleFileChange, () => setPictureInputResetKey(prev => prev + 1));
    }, [prop.formData, useUploadPic.handleFileChange]);
    const LibTabsPropA: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: { Basic: "基本", Status: "狀態", Tags: "標籤", Img: "成果照片", Photo: "相片", System: "系統資訊" },
    };
    const componentsA: Record<string, ReactNode[]> = {
        Basic: [
            <LibDropList
                Style={prop.theme.DropList}
                Options={prop.cateOpts}
                {...setField(SpecUSRFields.CategoryId, "string")}
            />,
        ],
        Status: [
            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.statusOpts}
                {...setField(SpecUSRFields.ContentStatus, "number", {
                    strategy: "sum",
                    sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number),
                })}
            />,
        ],
        Tags: [
            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.tagOpts}
                {...setField(SpecUSRFields.Tags, "string", "csv")}
            />,
        ],
        Img: [
            <LibFile
                key={`SpecUSRPictureInput_${pictureInputResetKey}`}
                Style={prop.theme.File}
                ColumnDisplayName={`選擇圖片`}
                Multiple={SpecUSRPictureUploadLimit.multiple}
                InputValue={""}
                accept={SpecUSRPictureUploadLimit.accept}
                maxFileCount={SpecUSRPictureUploadLimit.maxFileCount}
                maxFileSizeMB={SpecUSRPictureUploadLimit.maxFileSizeMB}
                parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                onChange={(files) => handleSpecUSRPictureChange(files, prop.formData, useUploadPic.handleFileChange)}
            >
                <LibPicture
                    key="preview"
                    ColumnDisplayName={useUploadPic.result.previewUrl ?? ""}
                    PicSrc={previewSrc}
                    PicDescription="選中的圖片"
                    onRemove={handleRemovePicture}
                    removeDisabled={!hasPicture}
                />
            </LibFile>,
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecUSRFields.PicDescription, "string")}
            />,
        ],
        Photo: [<UploadPicComp theme={prop.theme} formData={prop.formData} />, <PhotoComp theme={prop.theme} formData={prop.formData} />],
        System: [<SystemInfoTabComp theme={prop.theme} formData={prop.formData} />],
    };
    return <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>;
};

const DetailComp = (prop: { theme: IBETheme; formData: SpecUSRFormBinding; visibleCols: Set<string>; }) =>
{
    const setField = useSetTableField<SpecUSRFormModel>(prop.formData);
    const rawDetails = prop.formData.data?._SpecUSRDetail ?? [];

    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibText.Merge("_", true, info.USRId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };

    /** 依類別設定定義 Detail 欄位呈現順序。 */
    const orderedKeys = [
        SpecUSRDetailFields.Year,
        SpecUSRDetailFields.AcademicYear,
        SpecUSRDetailFields.Courses,
        SpecUSRDetailFields.PracticeField,
        SpecUSRDetailFields.ProjectName,
        SpecUSRDetailFields.ExternalCooperationUnit,
        SpecUSRDetailFields.ProjectItem,
        SpecUSRDetailFields.Department,
        SpecUSRDetailFields.DuringExecution,
        SpecUSRDetailFields.PlanAmount,
        SpecUSRDetailFields.ExecutionStrategy,
        SpecUSRDetailFields.ContentIntroduction,
        SpecUSRDetailFields.ProjectConcept,
        SpecUSRDetailFields.ProjectHighlights,
        SpecUSRDetailFields.ProjectLeader,
        SpecUSRDetailFields.ProjectSubLeader,
        SpecUSRDetailFields.Cohost1,
        SpecUSRDetailFields.Cohost2,
        SpecUSRDetailFields.Commissioned,
        SpecUSRDetailFields.AttendTeam,
        SpecUSRDetailFields.Remark,
    ] as const;
    type FieldKey = typeof orderedKeys[number];

    /** 建立單一語系 Detail 欄位。 */
    const makeNodes = (rowKeys: Record<string, any>) =>
    {
        const nodes: Record<FieldKey, ReactNode> = {
            Year: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Year, "string", rowKeys)}
                />
            ),
            AcademicYear: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.AcademicYear, "number", rowKeys)}
                />
            ),
            Courses: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Courses, "string", rowKeys)}
                />
            ),
            PracticeField: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.PracticeField, "string", rowKeys)}
                />
            ),
            ProjectName: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectName, "string", rowKeys)}
                />
            ),
            ExternalCooperationUnit: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit, "string", rowKeys)}
                />
            ),
            ProjectItem: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectItem, "string", rowKeys)}
                />
            ),
            Department: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Department, "string", rowKeys)}
                />
            ),
            DuringExecution: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.DuringExecution, "string", rowKeys)}
                />
            ),
            PlanAmount: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.PlanAmount, "number", rowKeys)}
                />
            ),
            ExecutionStrategy: (
                <LibTextArea
                    Style={prop.theme.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ExecutionStrategy, "string", rowKeys)}
                />
            ),
            ContentIntroduction: (
                <LibTextArea
                    Style={prop.theme.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ContentIntroduction, "string", rowKeys)}
                />
            ),
            ProjectConcept: (
                <LibTextArea
                    Style={prop.theme.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectConcept, "string", rowKeys)}
                />
            ),
            ProjectHighlights: (
                <LibTextArea
                    Style={prop.theme.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectHighlights, "string", rowKeys)}
                />
            ),
            ProjectLeader: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectLeader, "string", rowKeys)}
                />
            ),
            ProjectSubLeader: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectSubLeader, "string", rowKeys)}
                />
            ),
            Cohost1: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Cohost1, "string", rowKeys)}
                />
            ),
            Cohost2: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Cohost2, "string", rowKeys)}
                />
            ),
            Commissioned: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Commissioned, "string", rowKeys)}
                />
            ),
            AttendTeam: (
                <LibTextBox
                    parentClass="col-md-6 col-12"
                    Style={prop.theme.TextBox2}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.AttendTeam, "string", rowKeys)}
                />
            ),
            Remark: (
                <LibTextArea
                    Style={prop.theme.TextArea}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Remark, "string", rowKeys)}
                />
            ),
        };
        return nodes;
    };

    /** 依語系建立 Detail 頁籤內容。 */
    const tabContent: Record<string, ReactNode[]> = rawDetails.reduce<Record<string, ReactNode[]>>((compMap, info, idx) =>
    {
        const detailRowId = Number(info.RowId ?? idx + 1);
        const langKey = LibText.Merge("_", true, info.USRId, info.RowId, info.Lang);
        const rowKeys = { [SpecUSRDetailFields.USRId]: info.USRId, [SpecUSRDetailFields.RowId]: info.RowId };
        const nodes = makeNodes(rowKeys);
        const showAll = prop.visibleCols.size === 0;
        const list = orderedKeys.filter(k => showAll || prop.visibleCols.has(k)).map(k => nodes[k]);

        const extras: ReactNode[] = [
            <DividerComp key={`${langKey}-div-1`} />,
            <SubFilesComp key={`${langKey}-files`} theme={prop.theme} formData={prop.formData} parentRowId={detailRowId} />,
            <DividerComp key={`${langKey}-div-2`} />,
            <SubUrlComp key={`${langKey}-url`} formData={prop.formData} parentRowId={detailRowId} />,
        ];

        compMap[langKey] = [...list, ...extras];
        return compMap;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

const SubFilesComp = (prop: { theme: IBETheme; formData: SpecUSRFormBinding; parentRowId: number; }) =>
{
    const detailBinding = useSpecUSRDetailBinding(prop.formData, prop.parentRowId);
    const setFileField = useSetTableFileField(detailBinding);
    const files = useMemo(() => [...(detailBinding.data._SpecUSRFile ?? [])].sort(compareRowId), [detailBinding.data._SpecUSRFile]);
    const addFile = useCallback(() =>
    {
        detailBinding.setFormData(prev => ({ ...prev, _SpecUSRFile: appendSpecUSRFile(prev) }));
    }, [detailBinding.setFormData]);
    const removeFile = useCallback((rowId: number) =>
    {
        detailBinding.setFormData(prev => ({ ...prev, _SpecUSRFile: (prev._SpecUSRFile ?? []).filter(file => file.RowId !== rowId) }));
    }, [detailBinding.setFormData]);
    return (
        <div role="group" className="mt-4" aria-label="檔案上傳">
            <div className="mb-2 font-semibold">檔案上傳</div>
            {files.map(file =>
            {
                const rowKeys = buildSpecUSRFileRowKeys(file);
                return (
                    <div key={`${file.ParentRowId}-${file.RowId}`} className="flex items-center gap-2 mb-2">
                        <LibFileInput
                            DefaultInputDisplay="請輸入附件說明"
                            Accept={SpecUSRAttachmentUploadLimit.accept}
                            maxFileCount={SpecUSRAttachmentUploadLimit.maxFileCount}
                            maxFileSizeMB={SpecUSRAttachmentUploadLimit.maxFileSizeMB}
                            onDelete={() => removeFile(Number(file.RowId ?? 0))}
                            {...setFileField(SpecUSRDetailFields._SpecUSRFile, SpecUSRFileFields.FileSrcId, SpecUSRFileFields.FileName, rowKeys, {
                                fileName: file.FileSrc?.FileName ?? "",
                                onlyFillNameIfEmpty: false,
                            })}
                        />
                    </div>
                );
            })}
            <RepeaterAddButton onClick={addFile} />
        </div>
    );
};

const SubUrlComp = (prop: { formData: SpecUSRFormBinding; parentRowId: number; }) =>
{
    const detailBinding = useSpecUSRDetailBinding(prop.formData, prop.parentRowId);
    const urls = detailBinding.data._SpecUSRUrl ?? [];
    const handleChange = useCallback((next: SpecUSRUrl[]) =>
    {
        detailBinding.setFormData(prev => ({ ...prev, _SpecUSRUrl: next }));
    }, [detailBinding.setFormData]);
    return (
        <LibUrlInput<SpecUSRUrl>
            items={urls}
            onChange={handleChange}
            parentValue={prop.parentRowId}
            fields={{ parentRowId: "ParentRowId", rowId: "RowId", title: "UrlDescription", url: "Url", target: "WindowTarget" }}
            label="外部連結"
            targets={{ 0: "本頁開啟", 1: "另開分頁" }}
            getDefault={({ rowId, parentValue }) => buildSpecUSRUrl(detailBinding.data, rowId, Number(parentValue ?? prop.parentRowId))}
        />
    );
};

const RepeaterAddButton = (prop: { onClick: () => void; }) =>
{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">
                    <div className="col-sm-10 offset-sm-2 float-md-left float-sm-none">
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 my-2" onClick={prop.onClick} aria-label="新增">
                            <i className="far fa-plus mr-2"></i>
                            新增
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UploadPicComp = (prop: { theme: IBETheme; formData: SpecUSRFormBinding; }) =>
{
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleRemoveSelectedFile = useCallback((removeIndex: number) =>
    {
        setSelectedFiles(prev => prev.filter((_file, index) => index !== removeIndex));
    }, []);
    const handleUpload = useCallback(async () =>
    {
        if (selectedFiles.length === 0 || isUploading) return;
        setError(null);
        setIsUploading(true);
        try
        {
            const internalIds = await uploadSpecUSRPhotos(selectedFiles);
            appendSpecUSRPhotos(prop.formData, internalIds, selectedFiles);
            setSelectedFiles([]);
        } catch (errorValue: unknown)
        {
            const message = errorValue instanceof Error ? errorValue.message : String(errorValue);
            setError(message);
            throw errorValue;
        } finally
        {
            setIsUploading(false);
        }
    }, [isUploading, prop.formData, selectedFiles]);
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
                            Multiple={SpecUSRPhotoBatchUploadLimit.multiple}
                            accept={SpecUSRPhotoBatchUploadLimit.accept}
                            maxFileCount={SpecUSRPhotoBatchUploadLimit.maxFileCount}
                            maxFileSizeMB={SpecUSRPhotoBatchUploadLimit.maxFileSizeMB}
                            onChange={setSelectedFiles}
                            InputValue=""
                        />
                    </div>
                    {error && <div className="col-12 alert alert-danger mt-2">{error}</div>}
                </div>
                <SelectedPhotoPreview files={selectedFiles} onRemove={handleRemoveSelectedFile} />
            </div>
        </LibModal>
    );
};

const SelectedPhotoPreview = (prop: { files: File[]; onRemove: (index: number) => void; }) =>
{
    if (prop.files.length === 0) return null;
    return (
        <div className="col-12">
            <div className="row mt-3 mx-0">
                <div className="col-12 col-form-label bg-secondary mb-1">預覽圖片</div>
                {prop.files.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="col-12 border-bottom">
                        <div className="d-flex align-items-center">
                            <LibPicturePreview
                                ColumnDisplayName={file.name}
                                PicSrc={URL.createObjectURL(file)}
                                PicDescription={`選中的圖片 ${file.name}`}
                                onRemove={() => prop.onRemove(index)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PhotoComp = (prop: { theme: IBETheme; formData: SpecUSRFormBinding; }) =>
{
    const setField = useSetTableField<SpecUSRFormModel>(prop.formData);
    const photos = prop.formData.data?._SpecUSRPhoto ?? [];
    const removePhoto = useCallback((rowId: number) => removeSpecUSRPhoto(prop.formData, rowId), [prop.formData]);
    return (
        <>
            {photos.map(photo =>
            {
                const rowKeys = { [SpecUSRPhotoFields.USRId]: photo.USRId, [SpecUSRPhotoFields.RowId]: photo.RowId };
                return (
                    <LibPicture
                        key={`${photo.USRId}-${photo.RowId}`}
                        parentClass="col-xl-3 col-md-4 col-12"
                        ColumnDisplayName=""
                        PicSrc={FileManagementAPI.get_Server_Preview_Url(photo.PicSrcId)}
                        PicDescription="計畫成果相片"
                    >
                        <PhotoRemoveButton onClick={() => removePhoto(Number(photo.RowId ?? 0))} />
                        <LibTextBox
                            Style={prop.theme.TextBox2}
                            DefaultInputDisplay="請輸入"
                            {...setField(SpecUSRFields._SpecUSRPhoto, SpecUSRPhotoFields.Sort, "number", rowKeys)}
                        />
                        <PhotoInfoComp theme={prop.theme} formData={prop.formData} parentRowId={Number(photo.RowId ?? 0)} />
                    </LibPicture>
                );
            })}
        </>
    );
};

const PhotoRemoveButton = (prop: { onClick: () => void; }) =>
{
    const handleClick = useCallback(() =>
    {
        if (window.confirm("確定要刪除這張相片嗎？")) prop.onClick();
    }, [prop.onClick]);
    return (
        <div className="row">
            <div className="col-6 d-flex justify-content-end">
                <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" onClick={handleClick} aria-label="刪除相片">
                    <i className="far fa-trash-alt" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    );
};

const PhotoInfoComp = (prop: { theme: IBETheme; formData: SpecUSRFormBinding; parentRowId: number; }) =>
{
    const photoBinding = useSpecUSRPhotoBinding(prop.formData, prop.parentRowId);
    const setField = useSetTableField<SpecUSRPhoto>(photoBinding);
    const infos = photoBinding.data._SpecUSRPhotoInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: infos.reduce<Record<string, string>>((items, info) =>
        {
            const key = buildSpecUSRPhotoInfoTabKey(info);
            items[key] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return items;
        }, {}),
    };
    const tabContent = infos.reduce<Record<string, ReactNode[]>>((items, info) =>
    {
        const rowKeys = buildSpecUSRPhotoInfoRowKeys(info);
        items[buildSpecUSRPhotoInfoTabKey(info)] = [
            <LibTextBox
                key={`${info.ParentRowId}-${info.RowId}-title`}
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecUSRPhotoFields._SpecUSRPhotoInfo, SpecUSRPhotoInfoFields.Title, "string", rowKeys)}
            />,
        ];
        return items;
    }, {});
    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};
// #endregion

// #region Private
/** 建立計畫成果主圖預覽來源，沒有圖片時顯示預設圖。 */
const buildSpecUSRPicturePreviewSrc = (previewUrl: string, pictureId?: string | null): string =>
{
    return previewUrl || FileManagementAPI.get_Server_Preview_Url(pictureId) || ".png";
};

/** 判斷目前是否有真實圖片，預設圖不視為可刪除圖片。 */
const hasSpecUSRPicture = (previewUrl: string, pictureId?: string | null): boolean =>
{
    return Boolean(previewUrl || pictureId);
};

/** 清除計畫成果主圖，並重掛檔案輸入元件以同步清除 input 內部檔案。 */
const handleSpecUSRPictureRemove = (binding: SpecUSRFormBinding, handleFileChange: UploadPictureHandler, resetInput: () => void): void =>
{
    clearSpecUSRPictureInfo(binding);
    void handleFileChange([]);
    resetInput();
};

/** 上傳或清除計畫成果主圖，並同步圖片 ID 與圖片說明。 */
const handleSpecUSRPictureChange = (files: File[], binding: SpecUSRFormBinding, handleFileChange: UploadPictureHandler): void =>
{
    if (files.length === 0)
    {
        clearSpecUSRPictureInfo(binding);
        void handleFileChange([]);
        return;
    }

    const pictureDescription = buildSpecUSRPictureDescription(files[0]);
    void handleFileChange(files, internalId => updateSpecUSRPictureInfo(binding, internalId, pictureDescription));
};

/** 清除計畫成果主圖 internalId 與圖片說明。 */
const clearSpecUSRPictureInfo = (binding: SpecUSRFormBinding): void =>
{
    binding.setFormData(prev => buildSpecUSRPictureClearData(prev ?? specUSREmptyData));
};

/** 回寫計畫成果主圖 internalId，並同步覆蓋圖片說明。 */
const updateSpecUSRPictureInfo = (binding: SpecUSRFormBinding, internalId: string, pictureDescription: string): void =>
{
    binding.setFormData(prev => buildSpecUSRPictureData(prev ?? specUSREmptyData, internalId, pictureDescription));
};

/** 建立計畫成果主圖清除後資料，避免保留舊圖片與舊圖片說明。 */
const buildSpecUSRPictureClearData = (source: SpecUSRFormModel): SpecUSRFormModel =>
{
    return { ...source, PictureId: "", PicDescription: "" };
};

/** 建立計畫成果主圖更新後資料，圖片說明跟著新檔案同步更新。 */
const buildSpecUSRPictureData = (source: SpecUSRFormModel, internalId: string, pictureDescription: string): SpecUSRFormModel =>
{
    return { ...source, PictureId: internalId, PicDescription: pictureDescription };
};

/** 從圖片檔案建立預設圖片說明，去除副檔名。 */
const buildSpecUSRPictureDescription = (file?: File): string =>
{
    return String(LibAttachment.getDisplayFileNameWithoutExtension(file) ?? "").trim();
};

/** 依目前選取類別取得 Detail 欄位顯示集合。 */
const getVisibleCols = (formData: SpecUSRFormBinding, categoryCols: Record<string, string[]>): Set<string> =>
{
    const selectedCateId = formData.data?.CategoryId ?? "";
    return new Set(categoryCols?.[selectedCateId] ?? []);
};

/** 建立 SpecUSR Detail 子集合 Binding，讓巢狀集合沿用共用欄位 Hook。 */
const useSpecUSRDetailBinding = (binding: SpecUSRFormBinding, rowId: number): FormDataLike<SpecUSRDetail> =>
{
    const detail = useMemo(() => findSpecUSRDetail(binding.data, rowId), [binding.data, rowId]);
    const setFormData: FormDataLike<SpecUSRDetail>["setFormData"] = useCallback((action) =>
    {
        binding.setFormData(prev => updateSpecUSRDetail(prev, rowId, action));
    }, [binding.setFormData, rowId]);
    return useMemo(() => ({
        data: detail ?? buildEmptySpecUSRDetail(binding.data, rowId),
        setFormData,
        displayName: binding.displayName,
    }), [binding.data, binding.displayName, detail, rowId, setFormData]);
};

/** 建立 SpecUSR Photo 子集合 Binding，讓相片語系資訊沿用共用欄位 Hook。 */
const useSpecUSRPhotoBinding = (binding: SpecUSRFormBinding, rowId: number): FormDataLike<SpecUSRPhoto> =>
{
    const photo = useMemo(() => findSpecUSRPhoto(binding.data, rowId), [binding.data, rowId]);
    const setFormData: FormDataLike<SpecUSRPhoto>["setFormData"] = useCallback((action) =>
    {
        binding.setFormData(prev => updateSpecUSRPhoto(prev, rowId, action));
    }, [binding.setFormData, rowId]);
    return useMemo(() => ({
        data: photo ?? buildEmptySpecUSRPhoto(binding.data, rowId),
        setFormData,
        displayName: binding.displayName,
    }), [binding.data, binding.displayName, photo, rowId, setFormData]);
};

/** 依 RowId 取得指定 Detail。 */
const findSpecUSRDetail = (model: SpecUSRFormModel, rowId: number): SpecUSRDetail | undefined =>
{
    return (model._SpecUSRDetail ?? []).find(detail => Number(detail.RowId ?? 0) === rowId);
};

/** 依 RowId 取得指定相片。 */
const findSpecUSRPhoto = (model: SpecUSRFormModel, rowId: number): SpecUSRPhoto | undefined =>
{
    return (model._SpecUSRPhoto ?? []).find(photo => Number(photo.RowId ?? 0) === rowId);
};

/** 更新指定 Detail，找不到資料時維持原表單。 */
const updateSpecUSRDetail = (
    model: SpecUSRFormModel,
    rowId: number,
    action: SpecUSRDetail | ((prev: SpecUSRDetail) => SpecUSRDetail),
): SpecUSRFormModel =>
{
    const current = findSpecUSRDetail(model, rowId);
    if (!current) return model;
    const next = resolveStateAction(current, action);
    if (next === current) return model;
    return { ...model, _SpecUSRDetail: (model._SpecUSRDetail ?? []).map(detail => detail === current ? next : detail) };
};

/** 更新指定相片，找不到資料時維持原表單。 */
const updateSpecUSRPhoto = (
    model: SpecUSRFormModel,
    rowId: number,
    action: SpecUSRPhoto | ((prev: SpecUSRPhoto) => SpecUSRPhoto),
): SpecUSRFormModel =>
{
    const current = findSpecUSRPhoto(model, rowId);
    if (!current) return model;
    const next = resolveStateAction(current, action);
    if (next === current) return model;
    return { ...model, _SpecUSRPhoto: (model._SpecUSRPhoto ?? []).map(photo => photo === current ? next : photo) };
};

/** 解析 React SetStateAction。 */
const resolveStateAction = <T,>(current: T, action: T | ((prev: T) => T)): T =>
{
    return typeof action === "function" ? (action as (prev: T) => T)(current) : action;
};

/** 建立 Detail Binding 尚未載入時的安全空資料。 */
const buildEmptySpecUSRDetail = (model: SpecUSRFormModel, rowId: number): SpecUSRDetail =>
{
    return { USRId: model.USRId ?? "", RowId: rowId, _SpecUSRFile: [], _SpecUSRUrl: [] } as SpecUSRDetail;
};

/** 建立 Photo Binding 尚未載入時的安全空資料。 */
const buildEmptySpecUSRPhoto = (model: SpecUSRFormModel, rowId: number): SpecUSRPhoto =>
{
    return { USRId: model.USRId ?? "", RowId: rowId, _SpecUSRPhotoInfo: [] } as SpecUSRPhoto;
};

/** 依 RowId 排序巢狀資料。 */
const compareRowId = (left: { RowId?: number | null; }, right: { RowId?: number | null; }): number =>
{
    return Number(left.RowId ?? 0) - Number(right.RowId ?? 0);
};

/** 在指定 Detail 後方新增附件空列。 */
const appendSpecUSRFile = (detail: SpecUSRDetail): SpecUSRFile[] =>
{
    const files = detail._SpecUSRFile ?? [];
    const nextRowId = files.reduce((max, file) => Math.max(max, Number(file.RowId ?? 0)), 0) + 1;
    const nextRowNo = files.reduce((max, file) => Math.max(max, Number(file.RowNo ?? 0)), 0) + 1;
    const next: SpecUSRFile = {
        USRId: detail.USRId ?? "",
        ParentRowId: Number(detail.RowId ?? 0),
        RowId: nextRowId,
        RowNo: nextRowNo,
        FileSrcId: "",
        FileName: "",
    };
    return [...files, next];
};

/** 建立附件欄位定位鍵。 */
const buildSpecUSRFileRowKeys = (file: SpecUSRFile): Record<string, string | number> =>
{
    return {
        [SpecUSRFileFields.USRId]: file.USRId ?? "",
        [SpecUSRFileFields.ParentRowId]: Number(file.ParentRowId ?? 0),
        [SpecUSRFileFields.RowId]: Number(file.RowId ?? 0),
    };
};

/** 建立新網址資料。 */
const buildSpecUSRUrl = (detail: SpecUSRDetail, rowId: number, parentRowId: number): SpecUSRUrl =>
{
    return {
        USRId: detail.USRId ?? "",
        ParentRowId: parentRowId,
        RowId: rowId,
        RowNo: rowId,
        UrlDescription: "",
        Url: "",
        WindowTarget: 0,
    } as SpecUSRUrl;
};

/** 批次上傳計畫成果相片並回傳 internalId。 */
const uploadSpecUSRPhotos = async (files: File[]): Promise<string[]> =>
{
    const results: string[] = [];
    for (const file of files)
    {
        const response = await uploadSpecUSRPhoto(file);
        const internalId = response.Data?.[0];
        if (!internalId) throw new Error(`Upload ${file.name}: missing InternalId`);
        results.push(String(internalId));
    }
    return results;
};

/** 上傳單張相片；後端若使用 files 欄位則自動 fallback。 */
const uploadSpecUSRPhoto = async (file: File): Promise<{ Data?: string[]; }> =>
{
    try
    {
        return await postSpecUSRPhoto(file, "file");
    } catch (errorValue: unknown)
    {
        if (getUploadErrorStatus(errorValue) !== 400) throw errorValue;
        return postSpecUSRPhoto(file, "files");
    }
};

/** 呼叫暫存檔案上傳 API。 */
const postSpecUSRPhoto = async (file: File, fieldName: "file" | "files"): Promise<{ Data?: string[]; }> =>
{
    const formData = new FormData();
    formData.append(fieldName, file, file.name);
    const response = await fetch(FileManagementAPI.Server_UploadTemp, { method: "POST", body: formData, credentials: "include", mode: "cors" });
    if (!response.ok) throw await buildUploadError(response, file.name);
    return response.json() as Promise<{ Data?: string[]; }>;
};

/** 建立上傳錯誤並保留 HTTP status。 */
const buildUploadError = async (response: Response, fileName: string): Promise<Error & { status?: number; }> =>
{
    const text = await response.text().catch(() => "");
    const error = new Error(`Upload ${fileName} failed: ${response.status} ${text}`) as Error & { status?: number; };
    error.status = response.status;
    return error;
};

/** 取得上傳錯誤 HTTP status。 */
const getUploadErrorStatus = (errorValue: unknown): number =>
{
    return Number((errorValue as { status?: number; } | null)?.status ?? 0);
};

/** 將批次上傳結果追加到 FormModel 相片集合。 */
const appendSpecUSRPhotos = (binding: SpecUSRFormBinding, internalIds: string[], files: File[]): void =>
{
    binding.setFormData(prev =>
    {
        const photos = prev._SpecUSRPhoto ?? [];
        const nextRowId = photos.reduce((max, photo) => Math.max(max, Number(photo.RowId ?? 0)), 0) + 1;
        const newPhotos = internalIds.map((internalId, index) => buildSpecUSRPhoto(prev, internalId, files[index], nextRowId + index));
        return { ...prev, _SpecUSRPhoto: [...photos, ...newPhotos] };
    });
};

/** 建立新相片與其多語系資訊。 */
const buildSpecUSRPhoto = (model: SpecUSRFormModel, internalId: string, file: File | undefined, rowId: number): SpecUSRPhoto =>
{
    return {
        USRId: model.USRId ?? "",
        RowId: rowId,
        RowNo: rowId,
        PicSrcId: internalId,
        Sort: rowId,
        _SpecUSRPhotoInfo: buildSpecUSRPhotoInfos(model.USRId, rowId, file),
    } as SpecUSRPhoto;
};

/** 建立新相片支援語系資訊。 */
const buildSpecUSRPhotoInfos = (usrId: string | null | undefined, parentRowId: number, file?: File): SpecUSRPhotoInfo[] =>
{
    const title = buildSpecUSRPictureDescription(file);
    return SUPPORTED_LANGS.map((lang, index) => ({
        USRId: usrId ?? "",
        ParentRowId: parentRowId,
        RowId: index + 1,
        RowNo: index + 1,
        Lang: lang,
        Title: title,
    } as SpecUSRPhotoInfo));
};

/** 從 FormModel 移除指定相片，巢狀資訊會隨相片一併移除。 */
const removeSpecUSRPhoto = (binding: SpecUSRFormBinding, rowId: number): void =>
{
    binding.setFormData(prev => ({ ...prev, _SpecUSRPhoto: (prev._SpecUSRPhoto ?? []).filter(photo => Number(photo.RowId ?? 0) !== rowId) }));
};

/** 建立相片資訊頁籤 key。 */
const buildSpecUSRPhotoInfoTabKey = (info: SpecUSRPhotoInfo): string =>
{
    return LibText.Merge("_", true, info.USRId, info.ParentRowId, info.RowId, info.Lang);
};

/** 建立相片資訊欄位定位鍵。 */
const buildSpecUSRPhotoInfoRowKeys = (info: SpecUSRPhotoInfo): Record<string, string | number> =>
{
    return {
        [SpecUSRPhotoInfoFields.USRId]: info.USRId ?? "",
        [SpecUSRPhotoInfoFields.ParentRowId]: Number(info.ParentRowId ?? 0),
        [SpecUSRPhotoInfoFields.RowId]: Number(info.RowId ?? 0),
    };
};
// #endregion

