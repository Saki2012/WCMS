



//import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
//import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
//import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
//import type { components } from "@/types/api";
//import clsx from "clsx";
//import * as SchemaFields from "@/types/SchemaFields";
//import { useMemo } from "react";
//import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
//type BannerSet = components["schemas"]["BannerSet_DTO"]
//const emptyData: BannerSet = {
//	Banner: {},
//	BannerDetail: [
//		{
//			RowId: 1,
//			Validate_Start: "",
//			Validate_End: "",
//			PicSrcId: "",
//			FontColor: "",
//		}
//	],
//	BannerDetailInfo: [
//		{
//			ParentRowId: 1,
//			RowId: 1,
//			Lang: "zh-tw",
//			Title: "",
//			Content: "",
//			URL: "",
//			URL_Open: 1,
//		},
//		{
//			ParentRowId: 1,
//			RowId: 2,
//			Lang: "en",
//			Title: "",
//			Content: "",
//			URL: "",
//			URL_Open: 1,
//		}
//	]
//}


export const PerformancesPage = () => {
	//	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251106004`)
	//	const bannerInternal = usebannerList.rawData?.[0]?.Banner?.InternalId ?? ""
	//	const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), bannerInternal, emptyData)
	//	const loadingList = [useBanner.isLoading, usebannerList.isLoading]
	//	const errorList = [useBanner.error, usebannerList.error]
	//	const sortedDetails = useMemo(() => {
	//		const list = useBanner.data?.BannerDetail ?? [];
	//		// 依 Detail.Sort 由小到大
	//		return [...list].sort((a, b) => {
	//			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
	//			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
	//			// 次排序：RowId，確保順序穩定
	//			return as - bs || (a.RowId ?? 0) - (b.RowId ?? 0);
	//		});
	//	}, [useBanner.data?.BannerDetail]);

	return (



		<section
			className="Performances_section + Layout_Padding_4_top + Layout_Padding_1_bottom + bg-custom-Customize_color"
			style={{
				backgroundImage: "url(/images/bg/underline_01_W_1920x292.svg)",
			}}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize3">
						<div className="Show_Info_Box">
							<div className="row">
								<div className="col-12">
									<div className="show_inner">
										<div className="col-md-7 col-sm-12 col-12 + px-0">
											<div className="Left_info left_gap">
												<div className="info_Nshow">
													<i className="fas fa-chevron-circle-right me-1" />
													<span className="sr-only">指示箭頭圖示</span>
													<span className="RG-Line">最新展演</span>
												</div>
												<div className="info_TXT">
													<p className="T-big">
														李婧慧老師新書發表
														＿《交織（Kotekan）與得賜（Taksu）：巴里島音樂與社會——以克差（Kecak）為中心的研究》
													</p>
													<p className="T-small">
														活動地點 ：臺灣音樂館二樓常設展區
													</p>
												</div>
											</div>
										</div>
										<div className="col-md-4 col-sm-12 col-12 + offset-md-1 + px-0">
											<div className="Right_info">
												<div className="info_TXT">
													<p className="T-small + Cmb-0">展演時間 :</p>
													<p className="T-BBbig">
														<span className="Date Start">2025.10.12</span>
														<span className="Week">（日）</span>
														<span className="~~">～</span>
														<span className="End Date">2025.10.24</span>
														<span className="Week">（五）</span>
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>


	);
};
