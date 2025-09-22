import { LibCheckBox, LibTextBox, LibTextArea, LibFile, LibDropList, LibPicture } from "@/SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook"
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import * as SchemaFields from "@/types/SchemaFields";
import type { components } from "@/types/api";
import WebResourceProvider from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { parseBitmaskToStringArray, sumStringArrayToBitmask } from "@/SysCore/Utils/Library/LibData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { number } from "zod";
import { useFormToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type WebResourceInfo = components["schemas"]["WebResourceInfo_DTO"]
const emptyData: WebResourceSet = { WebResource: {}, WebResourceInfo: [] }
/** 網路資源表單
 * @returns 
 */
export const WebResourceFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const formData = useFetchFormData<WebResourceSet>(WebResourceProvider(), internalId, emptyData)
    const useCategory = useGetCategoryListByProgId("WebResource", prop.lang);
    const useTag = useGetTagListByProgId("WebResource", prop.lang);
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const windowTarget = useFetchEnumOptions("WindowTarget")
    const useToolbar = useFormToolbarActions(WebResourceProvider(), formData.data as WebResourceSet, internalId as string, () => formData.refetch())
    useEnsureLangDetails(formData, { headerName: SchemaFields.WebResourceSetFields.WebResource, detailName: SchemaFields.WebResourceSetFields.WebResourceInfo, parentKeys: [SchemaFields.WebResourceFields.WebResourceId] });
    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading, windowTarget.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error, windowTarget.error]
    const formProp: FormCompProp = { Title: "新增網路資源", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }


    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} cateOpts={useCategory.data} statusOpts={useContentStatus.data} tagOpts={useTag.data} />
            <DetailComp theme={prop.theme} formData={formData} urlOpenOpt={windowTarget.data} />
        </FormComp>
    )
}

const HeaderComp = (prop: {
    theme: IBETheme; formData: UseFetchFormDataResult<WebResourceSet>;
    cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;
}) => {
    const setField = useSetTableField<WebResourceSet>(prop.formData);
    const useUploadPic = useUploadPicture();
    const initialPicId = prop.formData.data?.WebResource?.PicId;
    const previewSrc = useUploadPic.result.previewUrl || (initialPicId ? `${FileManagementAPI.PREVIEW_URL}/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");
    const LibTabsPropA: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Img": "圖片", }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.Categories, 'string', undefined, 'csv')} />,
        ],
        Status: [
            <LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />
        ],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.Tags, 'string', undefined, 'csv')} />],
        Img: [
            <LibFile Style={prop.theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}
                InputValue={""}
                accept="image/*"
                parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                onChange={(files) =>
                    useUploadPic.handleFileChange(files, (internalId) => {
                        prop.formData.setFormData((prev) => ({ ...prev, WebResource: { ...prev?.WebResource, PicId: internalId, }, }));
                    })
                }>
                <LibPicture key="preview" ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""} PicSrc={previewSrc} PicDescription={`選中的圖片`} />
            </LibFile>,
            <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.WebResourceSetFields.WebResource, SchemaFields.WebResourceFields.PicDescription, "string")} />,
        ]
    }

    return <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>
}

const DetailComp = (prop: { theme: IBETheme, formData: UseFetchFormDataResult<WebResourceSet>; urlOpenOpt: Record<string, string>; }) => {
    const setField = useSetTableField<WebResourceSet>(prop.formData);
    const rawDetails = prop.formData.data?.WebResourceInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.WebResourceId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.WebResourceId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.WebResourceInfoFields.WebResourceId]: info.WebResourceId, [SchemaFields.WebResourceInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.WebResourceSetFields.WebResourceInfo, SchemaFields.WebResourceInfoFields.Title, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.WebResourceSetFields.WebResourceInfo, SchemaFields.WebResourceInfoFields.Content, "string", rowKeys)} />,
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.WebResourceSetFields.WebResourceInfo, SchemaFields.WebResourceInfoFields.ResUrl, "string", rowKeys)} />,
                <LibDropList Style={prop.theme.DropList} Options={prop.urlOpenOpt} {...setField(SchemaFields.WebResourceSetFields.WebResourceInfo, SchemaFields.WebResourceInfoFields.Url_OpenType, "number", rowKeys)} />,
            ]
            return compMap;
        }, {}
    );

    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)

}
