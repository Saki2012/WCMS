import type { components } from "@/types/api";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
import type { RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import GalleryProvider from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import { GalleryViewComp, type MainGridContentProp } from "@/Features/Pages/Client/Scaffold/ContentViewMode/GalleryView/GalleryView";
import { useCategoryListData } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";

const useGalleryList = (lang: string, categoryIds: string, tagIds: string) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.GalleryFields.Categories} HasAny (${categoryIds})`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.GalleryFields.Tags} HasAny (${tagIds})`)
    condition = LibMerge(" And ", false, condition, `${SchemaFields.GalleryFields.ContentStatus} !& 4`)//不包含隱藏的資料
    const provider = GalleryProvider();
    return useFetchGridListData<GallerySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.InternalId],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Categories],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.CoverPicSrcId],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.CreateTime],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Validate_Start],
            [SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Lang],
            [SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Title],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.GalleryFields.InternalId,
                SchemaFields.GalleryFields.Categories,
                SchemaFields.GalleryFields.CoverPicSrcId,
                SchemaFields.GalleryFields.CreateTime,
                SchemaFields.GalleryFields.Validate_Start,
                `${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Lang}`,
                `${SchemaFields.GalleryFields._GalleryInfo}.${SchemaFields.GalleryInfoFields.Title}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: SchemaFields.GalleryFields.Validate_Start, Desc: true }],
            PageNumber: page,
            PageSize: 12,
        }),
        parseRow: (item, columns) => {
            const data = item.Gallery ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";

                switch (col.key) {
                    case SchemaFields.GalleryInfoFields.Title:
                        // content = data?.find(d => d.Lang === lang)?.Title ?? "";
                        break;
                    case SchemaFields.GalleryFields.CreateTime:
                    case SchemaFields.GalleryFields.ModifyTime:
                    case SchemaFields.GalleryFields.Validate_Start:
                        content = FormatDate((data as any)[col.key]);
                        break;
                    default:
                        content = (data as any)[col.key] ?? "";
                        break;
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [lang, categoryIds, tagIds],
    });
};


export interface IGalleryListOptions { Title: string, Category?: string; Tag?: string; Style: number; }
interface IGalleryListProps { Theme: IFETheme; Lang: Lang; Options?: IGalleryListOptions; title: string }


export const GalleryListComp = (props: IGalleryListProps) => {
    const useCategoryList = useCategoryListData("Gallery", props.Lang)
    const useListData = useGalleryList(props.Lang, props.Options?.Category ?? "", props.Options?.Tag ?? "");

    const isLoading = [useListData.isLoading, useCategoryList.isLoading, useCategoryList.isLoading];
    const errors = [useListData.error, useCategoryList.error, useCategoryList.error];

    const CompProps: MainGridContentProp[] = GetGridViewContentProps(props.Lang, useListData.rawData, useCategoryList.rawData)




    return <GalleryViewComp Title={props.title} MainContentProps={CompProps} gridProps={useListData.gridProps} Theme={props.Theme} LoadingList={isLoading} ErrorList={errors} />;
};



const GetGridViewContentProps = (lang: string, rawData: GallerySet[], categoryList: CategorySet[]): MainGridContentProp[] => {
    if (!rawData) return [];
    let result: MainGridContentProp[] = [];
    rawData.map(item => {
        const gly = item.Gallery;
        const galleryId = gly?.InternalId ?? "";
        const title = item.GalleryInfo?.find(p => p?.Lang?.toLocaleLowerCase() === lang.toLocaleLowerCase())?.Title ?? "未命名";
        const coverPic = gly?.CoverPicSrcId ?? "";
        const categorys = (gly?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const categories = categorys.map(catId => categoryList?.find(s => String(s.Category?.CategoryId) === catId)?.CategoryDetail?.find(d => d.Lang === lang)?.CategoryName).filter((x): x is string => !!x).join("、");
        const validate_Start = FormatDate(gly?.Validate_Start) ?? "";
        result.push({
            galleryInternalId: galleryId,
            Title: title,
            CoverPicInternlId: coverPic,
            CategoryNames: categories,
            Validate_StartDate: validate_Start,
        });
    });
    return result;
};
