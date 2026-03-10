import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { components } from "@/types/api";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import LibCheckBox from "@/SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import LibCalendar from "@/SysCore/Components/FormField/FieldComponets/LibCalendar_Comp";
import { LibTextBox, LibTinyMCE, LibFile, LibPicture, LibFileInput } from "@/SysCore/Components/FormField/LibFormField";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { PreviewFrame } from "@/Features/Pages/Server/Scaffold/PreviewFrame/PreviewFrame";
import { AnnouncementDetailFields, AnnouncementDetailFileFields, AnnouncementFields, AnnouncementSetFields } from "@/types/SchemaFields";
import { useAnnouncementFormFetchData } from "./Server_Announcement_Form_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"];
type PreviewPayload = | { type: "wcms:preview"; module: "announcement"; payload: { kind: "dto"; dto: AnnouncementSet } };
const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [], AnnouncementDetailFile: [] };

export const Server_Announcement_Form_Comp = (props: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() => {navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));}, [navigate, pathname]);
        // Preview
    const [open, setOpen] = useState(false);
    const [payload, setPayload] = useState<PreviewPayload | undefined>(undefined);
    const handlePreviewFromDto = useCallback((dto: AnnouncementSet) => {
            setPayload({type: "wcms:preview",module: "announcement",payload: { kind: "dto", dto },});
            setOpen(true);
        }, []);
    const actionsOpt = useMemo(() => {return { onBackToList, onPreviewFromDto: handlePreviewFromDto };}, [onBackToList, handlePreviewFromDto]);
    const getData = useAnnouncementFormFetchData({lang: props.lang,internalId: internalId ?? "",emptyData, actionsOpt});
    
    const propForm: FormCompProp = {Title: internalId ? "修改公告" : "新增公告",Theme: props.theme,IsLoading: getData.isLoading,ErrorList: getData.errors,Actions: getData.rawData.actions,};
    // return（不動 div/DOM 結構）
    return (
        <FormComp prop={propForm}>
            <HeaderComp theme={props.theme} formData={getData.rawData.formData} cateOpts={getData.rawData.categoryMap} statusOpts={getData.rawData.statusOpts}tagOpts={getData.rawData.tagMap} />
            <DetailComp theme={props.theme} formData={getData.rawData.formData} />
            <PreviewFrame open={open} siteIndex={""} onClose={() => setOpen(false)} payload={payload} title="預覽" />
        </FormComp>
    );
};
const HeaderComp = (prop: {theme: IBETheme;formData: UseFetchFormDataResult<AnnouncementSet>;cateOpts: Record<string, string>;
    statusOpts: Record<string, string>;tagOpts: Record<string, string>;}) => {
    // 宣告變數
    const setField = useSetTableField<AnnouncementSet>(prop.formData);
    const useUploadPic = useUploadPicture();
    const initialPicId = prop.formData.data?.Announcement?.PictureId;
    const previewSrc = useUploadPic.result.previewUrl || (initialPicId ? `${FileManagementAPI.PREVIEW_URL}/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤", Pic: "圖片",System:"系統資訊" },};
    const tabContent: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Categories, "string", undefined, "csv")}/>,
            <LibCalendar {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start, "datetime")} />,
            <LibCalendar {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_End, "datetime")} />,
        ],
        Status: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(AnnouncementSetFields.Announcement,AnnouncementFields.ContentStatus,"number",undefined, { strategy: "sum", sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) },)}/>,
        ],
        Tags: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.Tags, "string", undefined, "csv")}/>,
        ],
        Pic: [
            <LibFile Style={prop.theme.File} ColumnDisplayName="選擇圖片" 
                Multiple={false} InputValue="" accept="image/*" parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                onChange={(files) =>
                    useUploadPic.handleFileChange(files, (fileId) => {
                        prop.formData.setFormData(prev => ({...prev,Announcement: { ...prev.Announcement, PictureId: fileId },}));
                    })
                }
            >
                <LibPicture key="preview" ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""} PicSrc={previewSrc} PicDescription="選中的圖片"/>
            </LibFile>,
            <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(AnnouncementSetFields.Announcement, AnnouncementFields.PicDescription, "string")}/>,
        ],
        System: [<SystemInfoTabComp theme={prop.theme} formData={prop.formData} setKey={AnnouncementSetFields.Announcement} />]
    };
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};
const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<AnnouncementSet> }) => {
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
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Title, "string", rowKeys)}/>,
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.SubTitle, "string", rowKeys)}/>,
                <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Content, "string", rowKeys)}/>,
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Url, "string", rowKeys)}/>,
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.UrlDescription, "string", rowKeys)}/>,
                <SubDetailComp theme={prop.theme} formData={prop.formData} parentRowId={detailRowId}/>,
            ];
            return compMap;
        },{},);
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};
const SubDetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<AnnouncementSet>; parentRowId: number }) => {
    // 宣告變數
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: AnnouncementDetailFile[] = props.formData.data?.AnnouncementDetailFile ?? [];
    const getFiles = (): AnnouncementDetailFile[] => {return allFiles.filter(f => f.ParentRowId === props.parentRowId).sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));};
    const commitFiles = (nextFiles: AnnouncementDetailFile[]) => {
        props.formData.setFormData(prev => ({...(prev ?? emptyData),AnnouncementDetailFile: nextFiles,}));
    };
    const addFile = () => {
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: AnnouncementDetailFile = {ParentRowId: props.parentRowId,RowId: nextRowId,FileId: "",FileName: "",};
        commitFiles([...allFiles, newItem]);
    };
    const removeFileAt = (i: number) => {
        const filtered = getFiles();
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.ParentRowId === target.ParentRowId && f.RowId === target.RowId));
        commitFiles(nextAll);
    };
    return (
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
    );
};