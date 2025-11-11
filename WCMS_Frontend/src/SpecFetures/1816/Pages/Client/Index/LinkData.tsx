//import bgImg from "@/SpecFetures/1816/Assets/Client/images/bg/background-transparent-image_1920x600.png"
//import img1 from "@/SpecFetures/1816/Assets/Client/images/links/Area_Links_icon/links_01_W_100x100_icon.svg"
//import img2 from "@/SpecFetures/1816/Assets/Client/images/links/Area_Links_icon/links_02_W_100x100_icon.svg"
//import img4 from "@/SpecFetures/1816/Assets/Client/images/links/Area_Links_icon/links_04_W_100x100_icon.svg"
//import img5 from "@/SpecFetures/1816/Assets/Client/images/links/Area_Links_icon/links_05_W_100x100_icon.svg"
//import img6 from "@/SpecFetures/1816/Assets/Client/images/links/Area_Links_icon/links_06_W_100x100_icon.svg"
//import img7 from "@/SpecFetures/1816/Assets/Client/images/links/Area_Links_icon/links_07_W_100x100_icon.svg"
//import Swiper from "@/SysCore/Libs/Swiper/swiper-bundle.min.js";

//import Swiper from "@/SpecFetures/1816/Assets/Client/Content/css_import/assets/swiper-11.1.14/swiper-bundle.min.js";
//import Swiper from '@/SpecFetures/1816/Assets/Client/Content/css_import/assets/swiper-11.1.14/swiper-bundle.min.js'
//import Swiper from "swiper/bundle";
//import "swiper/css/bundle";


import React, { type FC } from 'react';

import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
import { useEffect, useRef } from 'react';
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

	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251106005`)
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




		<section
			className="Link-icons_section Layout_Padding_4_bottom"
			style={{
				backgroundImage:
					"url(/images/bg/background-transparent-image_1920x600.png)",
			}}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize2">
						<div className="Link-icons-pos">
							<div className="content-box px-0">
								<div className="swiper" id="icon_area" >
									<div className="swiper-wrapper">

										{sortedDetails.map((p, i) => {
											const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
											const url = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.URL ?? ""
											return (


												<div key={i} className="swiper-slide">
													<div className="item">
														<a
															href={url}
															tabIndex={0}
															target="_blank"
															title={alt}>
															<div className="icon-wrapper">
																<div className="icon-area">
																	<div className="icon-type-image">
																		<img
																			alt={alt}
																			src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`}
																		/>
																	</div>
																</div>
																<div className="tit-contents">
																	<div className="Link-icons-title">{alt}</div>
																</div>
															</div>
														</a>
													</div>
												</div>

											)
										})}

									</div>
									<div className="swiper-nav mt-1">
										<button
											className="swiper-prev"
											role="presentation"
											tabIndex={0}
											type="button">
											<span aria-label="Previous" title="上一張">
												<span className="d-none">上一張</span>
											</span>
										</button>
										<button
											className="swiper-next"
											role="presentation"
											tabIndex={0}
											type="button">
											<span aria-label="Next" title="下一張">
												<span className="d-none">下一張</span>
											</span>
										</button>
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
