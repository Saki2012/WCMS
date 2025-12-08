import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { Lang } from "@/SysCore/i18n/lang";
import img1 from "@/SpecFetures/1817/Assets/Client/images/media_reports/TOPic_01_960x960.jpg"
import img2 from "@/SpecFetures/1817/Assets/Client/images/media_reports/TOPic_02_960x960.png"


type BannerSet = components["schemas"]["BannerSet_DTO"]

export const LinkData = (props: { lang: Lang }) => {
	const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251106004`)
	const bannerInternal = usebannerList.rawData?.[0]?.Banner?.InternalId ?? ""
	const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), bannerInternal, {})
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
			<div className="pic_item">
				<a aria-label={""} href={""} role="button" tabIndex={0} target={"_blank"} title={""} type="button">
					<p className="TOPic_head + head_color_S1">{"北藝大傳音系"}</p>
					<div className="TOPic_body + body_border_S1 + bg-custom-Customize_color">
						<div className="TOPic_img">
							<img alt={""} src={img1} />
						</div>
						<span className="toplink-arrow + trd-music">
							<i className="fas fa-long-arrow-alt-right" />
							<span className="sr-only">前往</span>
						</span>
					</div>
				</a>
			</div>

			<div className="pic_item">
				<a aria-label={""} href={""} role="button" tabIndex={0} target={"_blank"} title={""} type="button">
					<p className="TOPic_head + head_color_S2">{"傳音系FB"}</p>
					<div className="TOPic_body + body_border_S2 + bg-custom-Customize_color">
						<div className="TOPic_img">
							<img alt={""} src={img2} />
						</div>
						<span className="toplink-arrow + trd-music">
							<i className="fas fa-long-arrow-alt-right" />
							<span className="sr-only">前往</span>
						</span>
					</div>
				</a>
			</div>
		</div>
	);
};
