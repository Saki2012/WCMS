import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
import type { RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../SysCore/Utils/Library/LibData";
import * as SchemaFields from "../../../../../types/SchemaFields";
import { Merge } from "../../../../../SysCore/Utils/Library/LibMergeData";
import type { Lang } from "../../../../../SysCore/i18n/lang";
import GalleryProvider from "../../../../Server/Layout/BizFunc/WebManagement/Gallery/Gallery_Api";
import { GalleryViewComp, type MainGridContentProp } from "../../Scaffold/ContentViewMode/GalleryView/GalleryView";
import { useCategoryListData } from "../../../../Server/Layout/BizFunc/WebManagement/Category/Category_Hook";

const useGalleryList = (lang: string, categoryIds: string, tagIds: string) => {
    var condition: string = "";
    if (categoryIds) condition = Merge(" And ", false, condition, `${SchemaFields.GalleryFields.Categories} HasAny (${categoryIds})`)
    if (tagIds) condition = Merge(" And ", false, condition, `${SchemaFields.GalleryFields.Tags} HasAny (${tagIds})`)
    condition = Merge(" And ", false, condition, `${SchemaFields.GalleryFields.ContentStatus} !& 4`)//不包含隱藏的資料
    const provider = GalleryProvider();
    return useFetchGridListData<GallerySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.InternalId],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.Categories],
            [SchemaFields.GallerySetFields.Gallery, SchemaFields.GalleryFields.CoverPicSrcId],
            [SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Lang],
            [SchemaFields.GallerySetFields.GalleryInfo, SchemaFields.GalleryInfoFields.Title],
        ],
        buildQueryCondition: (page) => ({
            Fields: [
                SchemaFields.GalleryFields.InternalId,
                SchemaFields.GalleryFields.Categories,
                SchemaFields.GalleryFields.CoverPicSrcId,
                `${SchemaFields.GallerySetFields.GalleryInfo}.${SchemaFields.GalleryInfoFields.Lang}`,
                `${SchemaFields.GallerySetFields.GalleryInfo}.${SchemaFields.GalleryInfoFields.Title}`,
            ],
            Condition: condition,
            OrderBy: [{ Col: SchemaFields.GalleryFields.ModifyTime, Desc: true }],
            PageNumber: page,
            PageSize: 12,
        }),
        parseRow: (item, columns) => {
            const data = item.Gallery ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                if (col.key === SchemaFields.GalleryInfoFields.Title) {
                    // content = data.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                } else if (col.key === SchemaFields.GalleryFields.ModifyTime) {
                    content = FormatDateTime((data as any)[col.key]);
                } else {
                    content = (data as any)[col.key] ?? "";
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
interface IGalleryListProps { Theme: IFETheme; Lang: string | Lang; Options?: IGalleryListOptions; }


export const GalleryListComp = (props: IGalleryListProps) => {
    const useCategoryList = useCategoryListData("Gallery", props.Lang)
    const useListData = useGalleryList(props.Lang, props.Options?.Category ?? "", props.Options?.Tag ?? "");

    const isLoading = [useListData.isLoading, useCategoryList.isLoading, useCategoryList.isLoading];
    const errors = [useListData.error, useCategoryList.error, useCategoryList.error];

    const CompProps: MainGridContentProp[] = GetGridViewContentProps(props.Lang, useListData.rawData, useCategoryList.rawData)




    return <GalleryViewComp Title={""} MainContentProps={CompProps} gridProps={useListData.gridProps} Theme={props.Theme} LoadingList={isLoading} ErrorList={errors} />;
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
        const created = gly?.CreateTime ?? "";
        result.push({
            galleryInternalId: galleryId,
            Title: title,
            CoverPicInternlId: coverPic,
            CategoryNames: categories,
            CreateDate: created,
        });
    });
    return result;
};
