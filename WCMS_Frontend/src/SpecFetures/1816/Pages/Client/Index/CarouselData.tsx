import bgImg from '@/SpecFetures/1816/Assets/Client/images/bg/background-transparent-image_1920x600.png'



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


export const CarouselData = () => {
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
		<section className="Carousel_slide_section">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="circle-1 iMG-Shape-3" />
					<div className="container-customize2">
						<div className="carousel slide" id="B5_default_carousel">
							<div className="control-singlebox">
								<div className="control-toggle">
									<a
										aria-label="暫停"
										aria-pressed="true"
										className="carousel-toggle-btn"
										href="javascript:void(0);"
										id="toggleCarousel"
										role="button"
										tabIndex={0}
										title="暫停"
										type="button">
										<span className="control-icon pause" />
										<span className="sr-only">暫停</span>
									</a>
								</div>
							</div>
							<div className="carousel-inner">
								{sortedDetails.map((p, i) => {
									const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
									return (
										<div key={i} className={clsx("carousel-item", i === 0 ? "active" : "")} data-bs-interval="5000">
											<img src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`}
												className="d-block w-100"
												alt={alt}
											/>
										</div>
									)
								})}



							</div>
							<div className="carousel-indicators">
								<a href="javascript:void(0);" tabIndex={0} title="上一張">
									<button
										aria-current="true"
										aria-label="Slide 1"
										className="active"
										data-bs-slide-to="0"
										data-bs-target="#B5_default_carousel"
										type="button"
									/>
								</a>
								<a href="javascript:void(0);" tabIndex={0} title="上一張">
									<button
										aria-label="Slide 2"
										className=""
										data-bs-slide-to="1"
										data-bs-target="#B5_default_carousel"
										type="button"
									/>
								</a>
								<a href="javascript:void(0);" tabIndex={0} title="上一張">
									<button
										aria-label="Slide 3"
										className=""
										data-bs-slide-to="2"
										data-bs-target="#B5_default_carousel"
										type="button"
									/>
								</a>
							</div>
							<div className="carousel_btn-icon-prev">
								<a
									data-bs-slide="prev"
									data-bs-target="#B5_default_carousel"
									href="javascript:void(0);"
									role="button"
									tabIndex={0}
									title="上一張"
									type="button">
									<div className="carousel-control-prev">
										<span
											aria-hidden="true"
											className="carousel-control-prev-icon"
										/>
										<span className="sr-only">Previous</span>
									</div>
								</a>
							</div>
							<div className="carousel_btn-icon-next">
								<a
									data-bs-slide="next"
									data-bs-target="#B5_default_carousel"
									href="javascript:void(0);"
									role="button"
									tabIndex={0}
									title="上一張"
									type="buttson">
									<div className="carousel-control-next">
										<span
											aria-hidden="true"
											className="carousel-control-next-icon"
										/>
										<span className="sr-only">Next</span>
									</div>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>



	);
};
