import { LibCheckBox, LibTextBox, LibFileInput } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import FileArchiveProvider from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { FileArchiveDetailFields, FileArchiveSetFields, FileArchiveFields, FileArchiveInfoFields, FileArchiveUrlDetailFields } from "@/types/SchemaFields";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { ProgId } from "@/Features/Hooks/Common/ProgId";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { LibUrlInput } from "@/SysCore/Components/FormField/FieldComponets/LibUrlInput_Comp";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"]
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"]
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"]
const emptyData: FileArchiveSet = { FileArchive: {}, FileArchiveInfo: [], FileArchiveDetail: [] }

/** 檔案室表單
 * @returns 
 */
export const Server_FileArchiveFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const provider = useMemo(() => { return FileArchiveProvider() }, [])
    const formData = useFetchFormData<FileArchiveSet>(provider, internalId, emptyData)
    const useCategory = useGetCategoryListByProgId(ProgId.FileArchive, prop.lang);
    const useTag = useGetTagListByProgId(ProgId.FileArchive, prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const status = useMemo(() => { const src = useContentStatus.data ?? {}; const { ["0"]: _drop, ...rest } = src; return rest as Record<string, string>; }, [useContentStatus.data]);
    useEnsureLangDetails(formData, { headerName: FileArchiveSetFields.FileArchive, detailName: FileArchiveSetFields.FileArchiveInfo, parentKeys: [FileArchiveFields.FileArchiveId], preferFirstLang: prop.lang });
    const actions = useActions(dirUrl, provider, formData.data as FileArchiveSet, internalId as string)
    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error]
    const formProp: FormCompProp = { Title: "新增檔案室", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }

    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={status} tagOpts={useTag.data} />
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
        Basic: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(FileArchiveSetFields.FileArchive, FileArchiveFields.CategoriesId, 'string', undefined, 'csv')} />,],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(FileArchiveSetFields.FileArchive, FileArchiveFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(FileArchiveSetFields.FileArchive, FileArchiveFields.TagsId, 'string', undefined, 'csv')} />]
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
            const rowKeys = { [FileArchiveInfoFields.FileArchiveId]: info.FileArchiveId, [FileArchiveInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(FileArchiveSetFields.FileArchiveInfo, FileArchiveInfoFields.Title, "string", rowKeys)} />,
                <DividerComp />,
                <SubFilesComp theme={prop.theme} formData={prop.formData} parentRowId={detailRowId} />,
                <DividerComp />,
                <SubUrlComp theme={prop.theme} formData={prop.formData} parentRowId={detailRowId} />,
            ]
            return compMap;
        }, {}
    );

    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}

const SubFilesComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<FileArchiveSet>; parentRowId: number }) => {
    const setFileField = useSetTableFileField(prop.formData);
    const allFiles: FileArchiveDetail[] = prop.formData.data?.FileArchiveDetail ?? [];
    const getFiles = (): FileArchiveDetail[] => allFiles.filter(f => f.ParentRowId === prop.parentRowId).sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: FileArchiveDetail[]) => {
        prop.formData.setFormData(prev => ({
            ...(prev ?? { FileArchive: {}, FileArchiveInfo: [], FileArchiveDetail: [], FileArchiveUrlDetail: [] }),
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
                    const rowKeys = { [FileArchiveDetailFields.FileArchiveId]: f.FileArchiveId, [FileArchiveDetailFields.ParentRowId]: f.ParentRowId, [FileArchiveDetailFields.RowId]: f.RowId, }
                    return (
                        <div key={`${f.ParentRowId}-${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput Style={prop.theme.FileInput} DefaultInputDisplay="請輸入附件說明" Accept="*/*" onDelete={() => removeFileAt(i)}
                                {...setFileField(FileArchiveSetFields.FileArchiveDetail, FileArchiveDetailFields.FileSrcId, FileArchiveDetailFields.FileName, rowKeys,)} />
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

const SubUrlComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<FileArchiveSet>; parentRowId: number }) => {
    const allUrls: FileArchiveUrlDetail[] = prop.formData.data?.FileArchiveUrlDetail ?? [];

    const handleChangeAll = (nextAll: FileArchiveUrlDetail[]) => {
        prop.formData.setFormData(prev => ({
            ...(prev ?? { FileArchive: {}, FileArchiveInfo: [], FileArchiveDetail: [], FileArchiveUrlDetail: [] }),
            FileArchiveUrlDetail: nextAll,
        }));
    };

    return (
        <LibUrlInput<FileArchiveUrlDetail>
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