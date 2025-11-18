

import { AdmissionsCarouselData } from '@/SpecFetures/1818/Pages/Client/Index/Section/AdmissionsCarouselData'

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


export const AboutPage = () => {
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






		<section className="About_section">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="iMG-Shape-1" />
					<div className="container-customize3">
						<div className="row Layout_Padding_1_bottom">
							<div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
								<video
									autoPlay
									className="about-video"
									controls
									loop
									playsInline
									preload="metadata">
									<source
										src="images/about/法政學院_後庭_1280x720.mp4"
										type="video/mp4"
									/>
									<track
										default
										kind="subtitles"
										label="中文"
										src="subs/zh-TW.vtt"
										srcLang="zh-TW"
									/>
									<track
										kind="subtitles"
										label="English"
										src="subs/en.vtt"
										srcLang="en"
									/>
									你的瀏覽器不支援 HTML5 視訊，請更新瀏覽器或下載檔案播放。
								</video>
							</div>
							<div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mt-lg-5 pt-lg-5 mt-0 pt-4">
								<div className="offset-3 col-6">
									<div className="headDiv mb-lg-5 mb-4">
										<span className="headDiv-txt-2 tw">關於我們</span>
									</div>
								</div>
								<div className="about-left">
									<p className="about-txt">
										跨洲學程按學期集結於德國、臺灣及墨西哥三地授課，由各校優秀師資以全英語教授亞洲、歐洲及美洲的社會經濟概況，因地制宜探討臺海兩岸關係、歐洲聯盟及北美自由貿易協議等重要議題，不僅增長經營管理知識，瞭解全球競爭環境及主要經濟體的變化，亦有利擴大學生國際視野與經驗。於第四學期，學生得選擇在任一地區以英語撰寫碩士論文並進行口試，同時，學生可逕依意願申請企業實習，期透過理論與實務結合，與企業產生聯結、良性互動。學生完成學業且符合各校畢業條件後，由三校各頒碩士學位證書及修業證明。藉由國立中興大學「全球事務研究跨洲碩士學位學程」嚴謹的課程規劃，學生不僅得建立跨洲人際社交網絡，亦具備全球就業市場所需之競爭力。114學年度預計與世界排名前300大名校華沙大學合作(原本兩所學校將不再合作)，學生於中興及華沙各修讀一學年，後以英文撰寫畢業論文及口試，通過兩校畢業條件後即可獲取雙學位。
									</p>
									<div className="btn-w100-wrapper justify-content-start mt-sm-5 mt-4">
										<div className="customize_btn">
											<a
												className="Btn_a"
												href="javascript:void(0);"
												role="button"
												tabIndex={0}
												target="_self"
												title="MORE INFO"
												type="button">
												<div className="BtnBox">
													<span>更多資訊</span>
												</div>
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="row Layout_Padding_1_top Layout_Padding_1_bottom">
							<div className="offset-lg-0 offset-md-4 offset-sm-3 offset-2 col-xl-3 col-lg-3 col-md-12 col-sm-12 col-12">
								<div className="headDiv mb-lg-5 mb-4">
									<span className="headDiv-txt-3 tw">招生入學</span>
								</div>
								<p className="headDiv-subtxt">
									在未來本學程亦將編入規劃成立之國際學院，以現有的合作為基礎，繼續擴大及成長，成為國際學院的亮點之一。
								</p>
							</div>
							<div className="col-xl-9 col-lg-9 col-md-12 col-sm-12 col-12">



								<AdmissionsCarouselData></AdmissionsCarouselData>





							</div>
						</div>
					</div>
				</div>
			</div>

		</section>

	);
};
