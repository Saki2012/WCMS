import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type GallerySet = components["schemas"]["GallerySet_DTO"];
import type { RowCell } from "../../../../../SysCore/Components/Grid/Grid_Data";
import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import { FormatDateTime } from "../../../../../SysCore/Utils/Library/LibData";
import * as SchemaFields from "../../../../../types/SchemaFields";
import { Merge } from "../../../../../SysCore/Utils/Library/LibMergeData";
import type { Lang } from "../../../../../SysCore/i18n/lang";
import GalleryProvider from "../../../../Server/Layout/BizFunc/WebManagement/Gallery/Gallery_Api";
import { GalleryViewComp, type MainGridContentProp } from "../../Scaffold/ContentViewMode/GalleryView/GalleryView";

const useGalleryList = (lang: string, categoryIds: string, tagIds: string) => {
    var condition: string = "";
    if (categoryIds) condition = Merge(" And ", false, condition, `${SchemaFields.GalleryFields.Categories} In (${categoryIds})`)
    if (tagIds) condition = Merge(" And ", false, condition, `${SchemaFields.GalleryFields.Tags} In (${tagIds})`)
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
            PageNumber: page,
            PageSize: 12,
        }),
        parseRow: (item, columns) => {
            const data = item.Gallery ?? {};
            const cells: RowCell[] = columns.map(col => {
                let content = "";
                if (col.key === SchemaFields.AnnouncementDetailFields.Title) {
                    // content = data.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                } else if (col.key === SchemaFields.AnnouncementFields.ModifyTime) {
                    content = FormatDateTime((data as any)[col.key]);
                } else {
                    content = (data as any)[col.key] ?? "";
                }
                return { col, content };
            });
            return { cells };
        },
        enabled: true,
        deps: [],
    });
};


export interface IGalleryListOptions { Category?: string; Tag?: string; Style: number; }
interface IGalleryListProps { Theme: IFETheme; Lang: string | Lang; Options?: IGalleryListOptions; }


export const GalleryListComp = (props: IGalleryListProps) => {

    const useListData = useGalleryList(props.Lang, props.Options?.Category ?? "", props.Options?.Tag ?? "");

    const isLoading = [useListData.isLoading];
    const errors = [useListData.error];

    const CompProps: MainGridContentProp[] = GetGridViewContentProps(props.Lang, useListData.rawData)
    return <GalleryViewComp Title={props.Lang} MainContentProps={CompProps} LoadingList={isLoading} ErrorList={errors} />;
};



const GetGridViewContentProps = (lang: string, rawData: GallerySet[]): MainGridContentProp[] => {
    if (!rawData) return [];
    let result: MainGridContentProp[] = [];
    rawData.map(item => {
        const g = item.Gallery;
        const galleryId = g?.InternalId ?? "";
        const title = item.GalleryInfo?.find(p => p?.Lang?.toLocaleLowerCase() === lang.toLocaleLowerCase())?.Title ?? "未命名";
        const coverPic = g?.CoverPicSrcId ?? "";
        const categories = g?.Categories ?? "";
        const created = g?.CreateTime ?? "";
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
