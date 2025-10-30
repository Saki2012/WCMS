import { LibCheckBox, LibTextBox, LibTextArea, LibFile, LibDropList, LibPicture } from "@/SysCore/Components/FormField/LibFormField";
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
import { useLocation, useParams } from "react-router";
import { useGetTagListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { useGetSpecCategoryListByProgId } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import { useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { SpecUSRDetailFields, SpecUSRModelFields, SpecUSRSetFields } from "@/types/SchemaFields";
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
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
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Img": "圖片", }
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
        ]
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
            AcademicYear: <LibTextBox parentClass="col-md-6 col-12" Style={prop.theme.TextBox2} DefaultInputDisplay="請輸入" {...setField(SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AcademicYear, "string", rowKeys)} />,
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
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.USRId, info.RowId, info.Lang)
            const rowKeys = {
                [SpecUSRDetailFields.USRId]: info.USRId,
                [SpecUSRDetailFields.RowId]: info.RowId,
            };
            const nodes = makeNodes(rowKeys);

            // 沒設定可視欄位時顯示全部；有設定時只保留在集合中的鍵
            const showAll = prop.visibleCols.size === 0;
            const list = orderedKeys
                .filter(k => showAll || prop.visibleCols.has(k))
                .map(k => nodes[k]);

            compMap[langKey] = list;
            return compMap;
        }, {}
    );

    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};