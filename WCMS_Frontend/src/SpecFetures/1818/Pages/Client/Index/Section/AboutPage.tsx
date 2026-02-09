
import PageManagementProvider from '@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api';
import WebResourceProvider from '@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api';
import { AdmissionsCarouselData } from '@/SpecFetures/1818/Pages/Client/Index/Section/AdmissionsCarouselData'
import { useResolveInternalIds } from '@/SysCore/Components/File/useResolveInternalIds';
import type { Lang } from '@/SysCore/i18n/lang';
import { LangNavLink } from '@/SysCore/i18n/LangLink';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import type { components } from "@/types/api";
import parse from 'html-react-parser';
import { useEffect, useMemo, useRef } from 'react';
import { IndexLabel } from "@/SpecFetures/1818/Pages/Client//Index/Section/IndexLabelText";

import HomepageVideo from '@/SpecFetures/1818/Assets/Client/Spec/HomepageVideo.mp4'

type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"]

export const AboutPage = (props: { lang: Lang }) => {
	const pvd = useMemo(() => { return { WebPvd: WebResourceProvider(), PagePvd: PageManagementProvider() } }, [])
	const { data: webSrcData } = useFetchFormData<WebResourceSet>(pvd.WebPvd, "6d052cd7-3bf2-40aa-ba42-4289190ba8dc", {})
	const { data: pageData } = useFetchFormData<PageManagementSet>(pvd.PagePvd, "4c7132ea-88e9-44a1-a9c5-3f89042275b6", {})
	const webSrcDt = webSrcData?.WebResourceInfo?.find(p => p.Lang === props.lang);
	const pageDt = pageData?.PageManagementDetail?.find(p => p.Lang === props.lang);
	const parseContent = useResolveInternalIds(pageDt?.Content ?? "", { locale: props.lang });
	const content = parseContent.html ? parse(parseContent.html) : null;
	// const videoRef = useRef<HTMLVideoElement | null>(null);
	// const videoSrc = webSrcDt?.ResUrl ?? "";
	// useEffect(() => { if (videoRef.current && videoSrc) { videoRef.current.load(); } }, [videoSrc]);
	return (
		<section className="About_section">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="iMG-Shape-1" />
					<div className="container-customize3">
						<div className="row Layout_Padding_1_bottom">
							<div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
								<video className="about-video" controls loop playsInline preload="metadata">
									<source src={HomepageVideo} type="video/mp4" />
									<track default kind="subtitles" label="中文" src="subs/zh-TW.vtt" srcLang="zh-TW" />
									<track kind="subtitles" label="English" src="subs/en.vtt" srcLang="en" />
									你的瀏覽器不支援 HTML5 視訊，請更新瀏覽器或下載檔案播放。
								</video>
							</div>
							<div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mt-lg-5 pt-lg-5 mt-0 pt-4">
								<div className="offset-3 col-6">
									<div className="headDiv mb-lg-5 mb-4">
										<span className="headDiv-txt-2 tw">{IndexLabel(props.lang).AboutUsTitle}</span>
									</div>
								</div>
								<div className="about-left">
									<p className="about-txt">
										{content}
									</p>
									<div className="btn-w100-wrapper justify-content-start mt-sm-5 mt-4">
										<div className="customize_btn">
											<LangNavLink className="Btn_a" to="/about/about-01" role="button" tabIndex={0} target="_self" title="MORE INFO" type="button">
												<div className="BtnBox">
													<span>{IndexLabel(props.lang).MoreInfo}</span>
												</div>
											</LangNavLink>
										</div>
									</div>
								</div>
							</div>
						</div>
						<AdmissionsCarouselData lang={props.lang} />
					</div>
				</div>
			</div>
		</section>
	);
};


