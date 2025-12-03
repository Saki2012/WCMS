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
	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251119001`)
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

		<section className="Links_section owl-box Layout_Padding_1_top Layout_Padding_1_bottom bg-white">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize3">
						<div className="row">
							<div className="offset-3 col-9">
								<div className="headDiv mb-lg-5 mb-4">
									<span className="headDiv-txt tw">相關連結</span>
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="owl-carousel owl-theme" id="Links_owl_carousel">

										{sortedDetails.map((p, i) => {
											const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
											const url = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.URL ?? ""
											const urlopen = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.URL_Open ?? ""
											return (
												<div key={i} className={clsx("item", i === 0 ? "active" : "")}  >
													<a
														href={url}
														tabIndex={0}
														target={(urlopen === 1 ? "_blank" : "_self")}
														title={alt}>
														<div className="wrapper_box">
															<div className="Qlink-item">
																<div className="Content_Div">
																	<div className="box_content">
																		<div className="tit-text">
																			{alt}
																		</div>
																	</div>
																</div>
																<div className="Img_Div w-100">
																	<div className="Qlinkimg-outer">
																		<img
																			alt={alt}
																			src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`}
																		/>
																	</div>
																</div>
															</div>
														</div>
													</a>
												</div>
											)
										})}

									</div>
									<div className="DIV-Box">
										<div className="control-box">


											<a
												aria-label="開始播放圖片輪播"
												aria-pressed="false"
												className="play me-1"
												href="#" onClick={(e) => { e.preventDefault(); }}
												data-bs-target="#carousel-Controls"
												id="Links_start"
												tabIndex={0}
												title="播放">
												<div id="cycleCarousel" className="contrl_start">
													<span className="control-start-icon">
														<span className="sr-only">開始播放圖片輪播</span>
													</span>
												</div>
											</a>
											<a
												aria-label="暫停圖片輪播"
												aria-pressed="true"
												className="stop ms-1"
												href="#" onClick={(e) => { e.preventDefault(); }}
												data-bs-target="#carousel-Controls"
												id="Links_pause"
												tabIndex={0}
												title="暫停">
												<div id="pauseCarousel" className="contrl_pause">
													<span className="control-pause-icon">
														<span className="sr-only">暫停圖片輪播</span>
													</span>
												</div>
											</a>
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
