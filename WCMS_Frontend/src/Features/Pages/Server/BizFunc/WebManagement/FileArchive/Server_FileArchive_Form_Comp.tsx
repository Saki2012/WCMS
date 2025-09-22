import { LibCheckBox, LibTextBox, LibFileInput } from "@/SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import * as SchemaFields from "@/types/SchemaFields";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"]
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"]
const emptyData: FileArchiveSet = { FileArchive: {}, FileArchiveInfo: [], FileArchiveDetail: [] }

/** 檔案室表單
 * @returns 
 */
export const Server_FileArchiveFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const formData = useFetchFormData<FileArchiveSet>(FileArchiveProvider(), internalId, emptyData)
    const useCategory = useGetCategoryListByProgId("FileArchive", prop.lang);
    const useTag = useGetTagListByProgId("FileArchive", prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    useEnsureLangDetails(formData, { headerName: SchemaFields.FileArchiveSetFields.FileArchive, detailName: SchemaFields.FileArchiveSetFields.FileArchiveInfo, parentKeys: [SchemaFields.FileArchiveFields.FileArchiveId] });
    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error]
    const formProp: FormCompProp = { Title: "新增檔案室", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, }

    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={useContentStatus.data} tagOpts={useTag.data} />
            <DetailComp theme={prop.theme} formData={formData} />
        </FormComp>
    )
}


const HeaderComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<FileArchiveSet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<FileArchiveSet>(prop.formData);
    const LibTabsPropA: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.CategoriesId, 'string', undefined, 'csv')} />,],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SchemaFields.FileArchiveSetFields.FileArchive, SchemaFields.FileArchiveFields.TagsId, 'string', undefined, 'csv')} />]
    }
    return (
        <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>
    )
}

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<FileArchiveSet>; }) => {
    const setField = useSetTableField<FileArchiveSet>(prop.formData);

    const rawDetails = prop.formData.data?.FileArchiveInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.FileArchiveId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info, idx) => {
            const detailRowId = info.RowId ?? idx;
            const langKey = LibMerge("_", true, info.FileArchiveId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.FileArchiveInfoFields.FileArchiveId]: info.FileArchiveId, [SchemaFields.FileArchiveInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.FileArchiveSetFields.FileArchiveInfo, SchemaFields.FileArchiveInfoFields.Title, "string", rowKeys)} />,
                <SubDetailComp theme={prop.theme} formData={prop.formData} parentRowId={detailRowId}></SubDetailComp>
            ]
            return compMap;
        }, {}
    );

    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}

const SubDetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<FileArchiveSet>; parentRowId: number }) => {
    const allFiles: FileArchiveDetail[] = prop.formData.data?.FileArchiveDetail ?? [];
    const getFiles = (): FileArchiveDetail[] => allFiles.filter(f => f.ParentRowId === prop.parentRowId).sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));

    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: FileArchiveDetail[]) => {
        prop.formData.setFormData(prev => ({
            ...(prev ?? { FileArchive: {}, FileArchiveInfo: [], FileArchiveDetail: [] }),
            FileArchiveDetail: nextFiles,
        }));
    };

    // 新增一筆附件列
    const addFile = () => {
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: FileArchiveDetail = { ParentRowId: prop.parentRowId, RowId: nextRowId, FileSrcId: "", FileName: "", };
        commitFiles([...allFiles, newItem]);
    };

    // 更新第 i 筆附件列（以「同一公告 + 同一 ParentRowId + 同一 RowId」定位）
    const updateFileAt = (i: number, patch: Partial<FileArchiveDetail>) => {
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
                            Style={prop.theme.FileInput} InputValue={f.FileSrcId ?? ""}
                            onChange={(internalId, fileName) => { updateFileAt(i, { FileSrcId: internalId }); }}
                            onNameChange={(name) => updateFileAt(i, { FileName: name })}
                            onDelete={() => removeFileAt(i)}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

