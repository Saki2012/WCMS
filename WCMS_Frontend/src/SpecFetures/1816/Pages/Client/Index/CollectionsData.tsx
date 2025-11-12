import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
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



export const CollectionsData = () => {
	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251106003`)
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


		<section className="Collections_section owl-box Layout_Padding_3_top Layout_Padding_5_bottom">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="circle-1 iMG-Shape-2" />
					<div className="container-customize2">
						<div className="row">
							<div className="col-12">
								<div className="headDiv mb-sm-5 mb-4">
									<span className="headDiv-txt">館藏櫥窗</span>
									<span className="headDiv-subtxt">Collection Showcase</span>
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="DIV-singleBox d-none">
										<div className="control-singlebox">
											<a
												aria-label="圖片輪播播放中，點擊暫停"
												aria-pressed="true"
												className="toggle ms-1"
												href="javascript:void(0);"
												id="Collections_toggle"
												tabIndex={0}
												title="暫停">
												<div className="control-toggle control-pause-icon">
													<span className="sr-only">圖片輪播播放中，點擊暫停</span>
												</div>
											</a>
										</div>
									</div>
									<div
										className="owl-carousel owl-theme"
										id="Collections_owl_carousel">
										{sortedDetails.map((p, i) => {
											const detail = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw");
											const alt = detail?.Title ?? ""
											const url = detail?.URL ?? ""
											const content = detail?.Content ?? ""
											const urlopen = detail?.URL_Open ?? ""
											return (


												<div key={i} className="item">
													<a
														href={url}
														//onclick="js_method();return false;"
														tabIndex={0}
														target={(urlopen === 1 ? "_blank" : "_self")}
														title="">
														<div className="wrapper_box">
															<figure className="card_figure">
																<div className="card_image_link">
																	<picture>
																		<img
																			alt={alt}
																			className="card_image"
																			src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`}
																		/>
																	</picture>
																</div>
															</figure>
															<div className="txtarea">
																<div className="card_catinfo">
																	<span className="card_catname">
																		<span className="mx-1">{alt}</span>
																	</span>
																</div>
																<div className="card_info">
																	<span className="card_title">{content}</span>
																</div>
															</div>
														</div>
													</a>
												</div>

											)
										})}
									</div>
									<div
										className="customize_btn mr-4 d-none"
										style={{
											bottom: "-40px",
											position: "absolute",
											right: "0",
										}}>
										<a
											className="Btn_a"
											href="javascript:void(0);"
											role="button"
											tabIndex={0}
											target="_self"
											title="更多館藏櫥窗"
											type="button">
											<div className="BtnBox">
												<span>更多館藏櫥窗</span>
												<span className="ml-2">+</span>
											</div>
										</a>
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
