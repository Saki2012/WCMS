import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibDropList, LibFile, LibModal, LibPicturePreview, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { MaterialFields, MaterialLangInfoFields, MaterialSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    buildMaterialInfoJsonDefaults,
    getMaterialPicturePreviewUrl,
    materialEmptyData,
    type MaterialFormRefs,
    type MaterialInfoFieldItem,
    type MaterialRowKeys,
    toMaterialPictureCellValue,
    useMaterialBatchPictureUpload,
    useMaterialFormTemplate,
    useMaterialLangTabs,
    useMaterialPictureEditGrid,
    useMaterialTagSelection,
} from "./Server_Material_Form_Hook";

// #region Property
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type MaterialInfoJson = Record<string, string>;

interface MaterialFormCompProps
{
    /** 舊 Route 仍會傳入 title，目前 Form 標題改由 ModelDisplayName 建立。 */
    title?: string;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface MaterialContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<MaterialSet>;

    /** Material Hook 整理後的參照資料 */
    refs: MaterialFormRefs;
}

interface MaterialBasicProps extends MaterialContentProps
{}

interface MaterialLangProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<MaterialSet>;

    /** Material Hook 整理後的參照資料 */
    refs: MaterialFormRefs;
}

interface MaterialLangItemProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<MaterialSet>;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: MaterialRowKeys;

    /** 動態欄位顯示設定 */
    infoItems: MaterialInfoFieldItem[];

    /** 動態欄位預設欄位 */
    infoDefaults: MaterialInfoJson;
}

interface MaterialInfoJsonEditorProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<MaterialSet>;

    /** Detail row keys，給 useSetJsonField 綁定欄位 */
    rowKeys: MaterialRowKeys;

    /** 動態欄位顯示設定 */
    infoItems: MaterialInfoFieldItem[];

    /** 動態欄位預設欄位 */
    infoDefaults: MaterialInfoJson;
}

interface MaterialPictureProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<MaterialSet>;
}

interface MaterialBatchUploadProps extends MaterialPictureProps
{}

interface MaterialBasicRenderOptions extends MaterialBasicProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<MaterialSet>>;
}

const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};
// #endregion

// #region Public
/** 後台物件 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_Material_Form_Comp = (props: MaterialFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const onBackToList = useCallback(() =>
    {
        navigate(buildBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = useMaterialFormTemplate({ lang: props.lang, theme: props.theme, internalId: internalId ?? "", emptyData: materialEmptyData, actionsOpt });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => <MaterialContentComp theme={props.theme} lang={props.lang} binding={vm.binding} refs={vm.refs} />}
        />
    );
};
// #endregion

// #region Section
/** 物件主要內容，維持基本資料 / 物件照片 / 系統資訊三個主要分頁。 */
const MaterialContentComp = (props: MaterialContentProps) =>
{
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本資料", Picture: "物件照片", System: "系統資訊" } };
    const components = buildMaterialMainTabContent(props);

    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

/** 物件基本資料區塊，類別、標籤、語系內容維持同一頁顯示。 */
const MaterialBasicComp = (props: MaterialBasicProps) =>
{
    const setField = useSetTableField<MaterialSet>(props.binding);
    const renderOpt = useMemo(() => ({ ...props, setField }), [props, setField]);

    return (
        <div className="row g-3">
            {buildMaterialBasicFields(renderOpt)}
            {buildMaterialTagFields(renderOpt)}
            <div className="col-12">
                <MaterialLangComp theme={props.theme} lang={props.lang} binding={props.binding} refs={props.refs} />
            </div>
        </div>
    );
};

/** 物件語系 Detail 區塊，語系資料由 Hook 統一整理。 */
const MaterialLangComp = (props: MaterialLangProps) =>
{
    const detailTabs = useMaterialLangTabs({
        binding: props.binding,
        lang: props.lang,
        infoFields: props.refs.infoFields,
        infoFieldDisplays: props.refs.infoFieldDisplays,
    });
    const infoDefaults = useMemo(() => buildMaterialInfoJsonDefaults(props.refs.infoFields), [props.refs.infoFields]);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: detailTabs.tabItems };
    const components = detailTabs.items.reduce<Record<string, ReactNode[]>>((compMap, item) =>
    {
        compMap[item.key] = [
            <MaterialLangItemComp
                key={item.key}
                theme={props.theme}
                binding={props.binding}
                rowKeys={item.rowKeys}
                infoItems={item.infoItems}
                infoDefaults={infoDefaults}
            />,
        ];
        return compMap;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

/** 物件相片區塊，批次上傳按鈕與 EditGrid 單筆新增按鈕分離。 */
const MaterialPictureGridComp = (props: MaterialPictureProps) =>
{
    const renderPicturePreview = useCallback((args: EditGridCellRenderArgs) => <MaterialPicturePreview value={args.value} />, []);
    const pictureGrid = useMaterialPictureEditGrid({ binding: props.binding, style: editGridStyle, renderPicturePreview });

    return (
        <div className="form-group">
            <MaterialBatchUploadComp theme={props.theme} binding={props.binding} />
            <EditGrid {...pictureGrid.editGridProps} />
        </div>
    );
};
// #endregion

// #region EntityComp
/** 建立物件主分頁內容。 */
const buildMaterialMainTabContent = (props: MaterialContentProps): Record<string, ReactNode[]> =>
{
    return {
        Basic: [<MaterialBasicComp key="Basic" theme={props.theme} lang={props.lang} binding={props.binding} refs={props.refs} />],
        Picture: [<MaterialPictureGridComp key="Picture" theme={props.theme} binding={props.binding} />],
        System: [<SystemInfoTabComp key="System" theme={props.theme} formData={props.binding} setKey={MaterialSetFields.Material} />],
    };
};

/** 建立物件基本資料欄位。 */
const buildMaterialBasicFields = (opt: MaterialBasicRenderOptions): ReactNode[] =>
{
    const categoryOpts = new Map<string, string>(Object.entries(opt.refs.categoryMap ?? {}));

    return [
        <LibDropList
            key="CategoryId"
            Style={opt.theme.DropList}
            Options={categoryOpts}
            AutoDefaultFirst={false}
            {...opt.setField(MaterialSetFields.Material, MaterialFields.CategoryId, "string")}
        />,
    ];
};

/** 建立物件標籤欄位。 */
const buildMaterialTagFields = (opt: MaterialBasicRenderOptions): ReactNode[] =>
{
    return [<MaterialTagEditorComp key="Tags" theme={opt.theme} binding={opt.binding} tagMap={opt.refs.tagMap} />];
};

/** 標籤編輯區，DTO 異動交給 Hook 處理。 */
const MaterialTagEditorComp = (props: { theme: IBETheme; binding: ServerFormBinding<MaterialSet>; tagMap: Record<string, string>; }) =>
{
    const tagSelection = useMaterialTagSelection({ binding: props.binding });

    return (
        <LibCheckBox
            Style={props.theme.CheckBox}
            ColumnDisplayName="標籤"
            options={props.tagMap}
            InputValue={tagSelection.selectedTagIds}
            onChange={tagSelection.onChange}
        />
    );
};

/** 單一語系內容區。 */
const MaterialLangItemComp = (props: MaterialLangItemProps) =>
{
    const setField = useSetTableField<MaterialSet>(props.binding);

    return (
        <div className="row g-3">
            <LibTextBox
                Style={props.theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(MaterialSetFields.MaterialLangInfo, MaterialLangInfoFields.MaterialName, "string", props.rowKeys)}
            />
            <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(MaterialSetFields.Material, MaterialFields.Price, "number")} />
            <MaterialInfoJsonEditorComp
                theme={props.theme}
                binding={props.binding}
                rowKeys={props.rowKeys}
                infoItems={props.infoItems}
                infoDefaults={props.infoDefaults}
            />
            <LibTinyMCE Style={props.theme.TinyMCE} {...setField(MaterialSetFields.MaterialLangInfo, MaterialLangInfoFields.Memo, "string", props.rowKeys)} />
        </div>
    );
};

/** 動態物件資訊 JSON 編輯器。 */
const MaterialInfoJsonEditorComp = (props: MaterialInfoJsonEditorProps) =>
{
    const binder = useSetJsonField<MaterialSet, MaterialInfoJson>(
        props.binding,
        MaterialSetFields.MaterialLangInfo,
        MaterialLangInfoFields.MaterialInfoJson,
        props.rowKeys,
        props.infoDefaults,
    );

    if (props.infoItems.length === 0)
    {
        return <div className="text-muted">請先選擇類別，系統會自動帶入可設定欄位。</div>;
    }

    return <div className="row g-3">{props.infoItems.map(item => buildMaterialInfoField(props.theme, binder, item))}</div>;
};

/** 批次上傳物件相片，與 EditGrid 單筆新增分離。 */
const MaterialBatchUploadComp = (props: MaterialBatchUploadProps) =>
{
    const batchUpload = useMaterialBatchPictureUpload({ binding: props.binding });

    return (
        <LibModal
            ModalName="批次上傳物件照片"
            BtnName1="關閉"
            BtnName2="儲存並上傳"
            onConfirm={batchUpload.uploadSelectedFiles}
            confirmDisabled={batchUpload.isUploading || batchUpload.selectedFiles.length === 0}
            confirmBusy={batchUpload.isUploading}
        >
            <div className="row mx-0">
                <div className="col-12">
                    <div className="row">
                        <LibFile
                            Style={props.theme.File}
                            ColumnDisplayName="選擇圖片(多選)"
                            Multiple={true}
                            onChange={(files) => batchUpload.setSelectedFiles(files)}
                            InputValue=""
                        />
                    </div>
                    {batchUpload.error && <div className="col-12 alert alert-danger mt-2">{batchUpload.error}</div>}
                </div>
                <MaterialBatchPreviewComp files={batchUpload.selectedFiles} />
            </div>
        </LibModal>
    );
};

/** 批次上傳前的圖片預覽清單。 */
const MaterialBatchPreviewComp = (props: { files: File[]; }) =>
{
    if (props.files.length === 0) return null;

    return (
        <div className="col-12">
            <div className="row mt-3 mx-0">
                <div className="col-12 col-form-label bg-secondary mb-1">預覽圖片</div>
                {props.files.map((file, index) =>
                {
                    const url = URL.createObjectURL(file);

                    return (
                        <div key={`${file.name}_${index}`} className="col-12 border-bottom">
                            <div className="d-flex align-items-center">
                                <LibPicturePreview ColumnDisplayName={file.name} PicSrc={url} PicDescription={`選中的圖片 ${file.name}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/** EditGrid 圖片預覽欄位。 */
const MaterialPicturePreview = (props: { value: unknown; }) =>
{
    const picValue = toMaterialPictureCellValue(props.value as never);
    const picSrc = picValue.url || getMaterialPicturePreviewUrl(picValue.internalId);
    const label = picValue.originalFileName || picValue.fileName || picValue.internalId || "物件照片";

    if (!picSrc) return <span className="text-muted">尚未選擇圖片</span>;

    return <LibPicturePreview ColumnDisplayName={label} PicSrc={picSrc} PicDescription={label} />;
};
// #endregion

// #region Private
/** 建立動態資訊欄位。 */
const buildMaterialInfoField = (
    theme: IBETheme,
    binder: ReturnType<typeof useSetJsonField<MaterialSet, MaterialInfoJson>>,
    item: MaterialInfoFieldItem,
): ReactNode =>
{
    const bind = binder.bind(item.field as keyof MaterialInfoJson, "string");

    return (
        <LibTextBox
            key={`MaterialInfo_${item.field}`}
            Style={theme.TextBox3}
            ColumnDisplayName={item.title}
            DefaultInputDisplay={`請輸入${item.title}`}
            InputValue={String(bind.value ?? "")}
            OnChange={bind.onChange}
        />
    );
};

/** 建立返回列表路徑。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(\/[^\/]*)?$/, "/List");
};
// #endregion
