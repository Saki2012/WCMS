import { LibTextBox, LibTinyMCE, LibFile, LibPicture, LibFileInput } from "@/SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "@/Features/Pages/Server/BizFunc/WebManagement/Category/Category_Hook";
import { useGetTagListByProgId } from "@/Features/Pages/Server/BizFunc/WebManagement/Tags/Tag_Hook";
import AnnouncementProvider from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { components } from "@/types/api";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import LibCheckBox from "@/SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import LibCalendar from "@/SysCore/Components/FormField/FieldComponets/LibCalendar_Comp";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { DefaultLang, LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type AnnouncementDetail = components["schemas"]["AnnouncementDetail_DTO"]
type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"]


const emptyData: AnnouncementSet = {
    Announcement: {},
    AnnouncementDetail: [],
    AnnouncementDetailFile: [],
}
/** 頁面表單
 * @returns 
 */
export const Server_AnnouncementFormComp = (props: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const useCategory = useGetCategoryListByProgId("Announcement", props.lang);
    const useTag = useGetTagListByProgId("Announcement", props.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const formData = useFetchFormData<AnnouncementSet>(AnnouncementProvider(), internalId, emptyData)
    const useToolbar = useFormToolbarActions(AnnouncementProvider(), formData.data as AnnouncementSet, internalId as string, () => formData.refetch())
    useEnsureLangDetails(formData, { headerName: SchemaFields.AnnouncementSetFields.Announcement, detailName: SchemaFields.AnnouncementSetFields.AnnouncementDetail, parentKeys: [SchemaFields.AnnouncementDetailFields.AnnouncementId] });
    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error]
    const prop: FormCompProp = { Title: "新增公告", Theme: props.theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }
    return (
        <FormComp prop={prop}>
            <HeaderComp theme={props.theme} formData={formData} cateOpts={useCategory.data} statusOpts={useContentStatus.data} tagOpts={useTag.data} />
            <DetailComp theme={props.theme} formData={formData} />
        </FormComp>
    )
}

const HeaderComp = (props: {
    theme: IBETheme; formData: UseFetchFormDataResult<AnnouncementSet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<AnnouncementSet>(props.formData);
    const useUploadPic = useUploadPicture();
    const initialPicId = props.formData.data?.Announcement?.PictureId;
    const previewSrc = useUploadPic.result.previewUrl || (initialPicId ? `${FileManagementAPI.PREVIEW_URL}/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Pic": "圖片" } }
    const tabContent: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox Style={props.theme.CheckBox} options={props.cateOpts} {...setField(SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Categories, 'string', undefined, 'csv')} />,
            <LibCalendar {...setField(SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Validate_Start, "string")} />,
            <LibCalendar {...setField(SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Validate_End, "string")} />,
        ],
        Status: [<LibCheckBox Style={props.theme.CheckBox} options={props.statusOpts} {...setField(SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(props.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={props.theme.CheckBox} options={props.tagOpts} {...setField(SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Tags, 'string', undefined, 'csv')} />,],
        Pic: [
            <LibFile Style={props.theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}
                InputValue={""}
                accept="image/*"
                parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                onChange={(files) =>
                    useUploadPic.handleFileChange(files, (internalId) => {
                        props.formData.setFormData((prev) => ({ ...prev, Announcement: { ...prev?.Announcement, PictureId: internalId, }, }));
                    })
                }>
                <LibPicture key="preview" ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""} PicSrc={previewSrc} PicDescription={`選中的圖片`} />
            </LibFile>,
            <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.PicDescription, "string")} />,
        ],
    };
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}
const DetailComp = (props: { theme: IBETheme, formData: UseFetchFormDataResult<AnnouncementSet> }) => {
    const setField = useSetTableField<AnnouncementSet>(props.formData);
    const rawDetails = props.formData.data?.AnnouncementDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.AnnouncementId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info, idx) => {
            const detailRowId = info.RowId ?? idx;
            const langKey = LibMerge("_", true, info.AnnouncementId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.AnnouncementDetailFields.AnnouncementId]: info.AnnouncementId, [SchemaFields.AnnouncementDetailFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Title, "string", rowKeys)} />,
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.SubTitle, "string", rowKeys)} />,
                <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Content, "string", rowKeys)} />,
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Url, "string", rowKeys)} />,
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.UrlDescription, "string", rowKeys)} />,
                <SubDetailComp theme={props.theme} formData={props.formData} parentRowId={detailRowId}></SubDetailComp>
            ]
            return compMap;
        }, {}
    );

    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
};

const SubDetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<AnnouncementSet>; parentRowId: number; }) => {
    const allFiles: AnnouncementDetailFile[] = props.formData.data?.AnnouncementDetailFile ?? [];
    const getFiles = (): AnnouncementDetailFile[] => allFiles.filter(f => f.ParentRowId === props.parentRowId).sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));

    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: AnnouncementDetailFile[]) => {
        props.formData.setFormData(prev => ({
            ...(prev ?? { Announcement: {}, AnnouncementDetail: [], AnnouncementDetailFile: [] }),
            AnnouncementDetailFile: nextFiles,
        }));
    };

    // 新增一筆附件列
    const addFile = () => {
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: AnnouncementDetailFile = { ParentRowId: props.parentRowId, RowId: nextRowId, FileId: "", FileName: "", };
        commitFiles([...allFiles, newItem]);
    };

    // 更新第 i 筆附件列（以「同一公告 + 同一 ParentRowId + 同一 RowId」定位）
    const updateFileAt = (i: number, patch: Partial<AnnouncementDetailFile>) => {
        const filtered = getFiles();
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.map(f => { const isSame = f.ParentRowId === target.ParentRowId && f.RowId === target.RowId; return isSame ? { ...f, ...patch } : f; });
        commitFiles(nextAll);
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
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-secondary mb-2">新增附件</button>
                {getFiles().map((f, i) => (
                    <div key={`${f.ParentRowId}-${f.RowId}`} className="flex items-center gap-2 mb-2">
                        <LibFileInput ColumnDisplayName={`附件 ${i + 1}`} DefaultInputDisplay="請選擇檔案"
                            Style={props.theme.FileInput} InputValue={f.FileId ?? ""}
                            onChange={(internalId, fileName) => { updateFileAt(i, { FileId: internalId }); }}
                            onNameChange={(name) => updateFileAt(i, { FileName: name })}
                            onDelete={() => removeFileAt(i)}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};