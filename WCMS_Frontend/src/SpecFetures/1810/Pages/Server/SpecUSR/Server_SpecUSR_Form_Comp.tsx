import { LibCheckBox, LibTextBox, LibTextArea, LibFile, LibDropList, LibPicture } from "@/SysCore/Components/FormField/LibFormField";
import * as SchemaFields from "@/types/SchemaFields";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import SpecUSRProvider from "@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api";
import { useParams } from "react-router";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useFormToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import { useGetSpecCategoryListByProgId } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import { useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
const emptyData: SpecUSRSet = { SpecUSR: {}, SpecUSRDetail: [], }

/** 網路資源表單
 * @returns 
 */
export const Server_USRProjFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const formData = useFetchFormData<SpecUSRSet>(SpecUSRProvider(), internalId, emptyData)
    const useCategory = useGetSpecCategoryListByProgId("SpecUSR", prop.lang);
    const useTag = useGetTagListByProgId("SpecUSR", prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const status = useMemo(() => { const src = useContentStatus.data ?? {}; const { ["0"]: _drop, ...rest } = src; return rest as Record<string, string>; }, [useContentStatus.data]);
    const useToolbar = useFormToolbarActions(SpecUSRProvider(), formData.data as SpecUSRSet, internalId as string, () => formData.refetch())
    useEnsureLangDetails(formData, { headerName: SchemaFields.SpecUSRSetFields.SpecUSR, detailName: SchemaFields.SpecUSRSetFields.SpecUSRDetail, parentKeys: [SchemaFields.SpecUSRModelFields.USRId], preferFirstLang: prop.lang });
    const isLoading = [formData.isLoading, useCategory.isLoading, useTag.isLoading, useContentStatus.isLoading]
    const errors = [formData.error, useCategory.error, useTag.error, useContentStatus.error]
    const formProp: FormCompProp = { Title: "新增USR計畫", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={status} tagOpts={useTag.data} />
            <DetailComp theme={prop.theme} formData={formData} />
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
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Img": "圖片", }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibDropList Style={prop.theme.DropList} Options={prop.cateOpts} {...setField(SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.CategoryId, 'string')} />],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.Tags, 'string', undefined, 'csv')} />],
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
            <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.PicDescription, 'string')} />
        ]
    }
    return (<TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>)
}

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecUSRSet>; }) => {
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
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.USRId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.SpecUSRDetailFields.USRId]: info.USRId, [SchemaFields.SpecUSRDetailFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Year, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.AcademicYear, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Courses, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.PracticeField, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectName, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ExternalCooperationUnit, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Department, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.DuringExecution, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.PlanAmount, "number", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ExecutionStrategy, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ContentIntroduction, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectConcept, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectHighlights, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectLeader, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Cohost1, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Cohost2, "string", rowKeys)} />,
                <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Commissioned, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Remark, "string", rowKeys)} />,]
            return compMap;
        }, {}
    );
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}
