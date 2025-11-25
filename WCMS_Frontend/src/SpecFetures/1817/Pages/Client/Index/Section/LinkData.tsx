import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
type BannerSet = components["schemas"]["BannerSet_DTO"]
const emptyData: BannerSet = {
	Banner: {},
	BannerDetail: [
		{
			RowId: 1,
			Validate_Start: "",
			Validate_End: "",
			PicSrcId: "",
			FontColor: "",
		}
	],
	BannerDetailInfo: [
		{
			ParentRowId: 1,
			RowId: 1,
			Lang: "zh-tw",
			Title: "",
			Content: "",
			URL: "",
			URL_Open: 1,
		},
		{
			ParentRowId: 1,
			RowId: 2,
			Lang: "en",
			Title: "",
			Content: "",
			URL: "",
			URL_Open: 1,
		}
	]
}


export const LinkData = () => {
	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251106004`)
	const bannerInternal = usebannerList.rawData?.[0]?.Banner?.InternalId ?? ""
	const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), bannerInternal, emptyData)
	const loadingList = [useBanner.isLoading, usebannerList.isLoading]
	const errorList = [useBanner.error, usebannerList.error]
	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		// 依 Detail.Sort 由小到大
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			// 次排序：RowId，確保順序穩定
			return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
		});
	}, [useBanner.data?.BannerDetail]);

	return (

		<div className="TOPic">



			{sortedDetails.map((p, i) => {
				const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
				const url = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.URL ?? ""
				const urlopen = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.URL_Open ?? ""
				return (




					<div key={i} className="pic_item">
						<a
							aria-label={alt}
							href={url}
							role="button"
							tabIndex={0}
							target={(urlopen === 1 ? "_blank" : "_self")}
							title={alt}
							type="button">
							<p className="TOPic_head + head_color_S1">{alt}</p>
							<div className="TOPic_body + body_border_S1 + bg-custom-Customize_color">
								<div className="TOPic_img">
									<img
										alt={alt}
										src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`}
									/>
								</div>
								<span className="toplink-arrow + trd-music">
									<i className="fas fa-long-arrow-alt-right" />
									<span className="sr-only">前往</span>
								</span>
							</div>
						</a>
					</div>


				)
			})}



		</div>


	);
};
