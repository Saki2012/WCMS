import { useBannerSetByInternalId } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import { useEffect, useMemo, useRef } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";

export const QuickLinksData = (props: { lang: Lang }) => {
	// 宣告變數：已知 internalId → 直接 QueryData
	const useBanner = useBannerSetByInternalId({ internalId: "b74facc4-6b1c-4642-b148-0a0aca751279" });

	const sortedDetails = useMemo(() => {
		const list = useBanner.data?.BannerDetail ?? [];
		return [...list].sort((a, b) => {
			const as = Number.isFinite(a?.Sort) ? Number(a.Sort) : Number.MAX_SAFE_INTEGER;
			const bs = Number.isFinite(b?.Sort) ? Number(b.Sort) : Number.MAX_SAFE_INTEGER;
			if (as !== bs) return as - bs;
			const ar = Number.isFinite(a?.RowId) ? Number(a.RowId) : Number.MAX_SAFE_INTEGER;
			const br = Number.isFinite(b?.RowId) ? Number(b.RowId) : Number.MAX_SAFE_INTEGER;
			return ar - br;
		});
	}, [useBanner.data?.BannerDetail]);

	const imgMapRef = useRef<Record<string, string>>({});

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!sortedDetails.length) return;

		const run = async () => {
			const tasks = sortedDetails.map(async (d) => {
				const id = d?.PicSrcId ?? "";
				if (!id) return { id, url: "" };
				const url = `${FileManagementAPI.PREVIEW_URL}/${id}`
				return { id, url };
			});

			const res = await Promise.all(tasks);
			const map: Record<string, string> = {};
			res.forEach(x => { if (x.id) map[x.id] = x.url; });
			imgMapRef.current = map;
		};

		run();
	}, [sortedDetails.length]);

	return (
		<section className="Links_section owl-box Layout_Padding_4_top Layout_Padding_4_bottom">
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="container-customize4">
						<div className="row">
							<div className="col-12">
								<div className="headDiv mb-3">
									{props.lang === "zh-tw" ?
										<>
											<span className="headDiv-txt">快速連結</span>
											<span className="headDiv-subtxt">Links</span>
										</> :
										props.lang === "en" ? <>
											<span className="headDiv-txt">Links</span>
										</> : ""
									}
								</div>
							</div>
							<div className="col-12">
								<div className="content-box px-0 mb-5">
									<div className="owl-carousel owl-theme" id="Links_owl_carousel">
										{sortedDetails.map((p, i) => {
											const info = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === props.lang)
											const alt = info?.Title ?? ""
											const url = info?.URL ?? ""
											const urlopen = info?.URL_Open === 0 ? "_self" : "_blank"
											return (
												<div key={i} className="item">
													<LangLink to={url} tabIndex={0} target={urlopen} title="">
														<div className="wrapper_box">
															<figure className="card_figure">
																<div className="card_image_link">
																	<picture>
																		<img className="card_image" src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`} alt={alt} />
																	</picture>
																</div>
															</figure>
														</div>
													</LangLink>
												</div>
											)
										})}
									</div>

									<div className="customize_btn mr-4 d-none" style={{ bottom: "-40px", position: "absolute", right: "0", }}>
										<a className="Btn_a" role="button" tabIndex={0} target="_self" title="更多連結" type="button">
											<div className="BtnBox">
												<span>更多連結</span>
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
