import bgImg from "@/SpecFetures/1817/Assets/Client/images/bg/underline_01_W_1920x292.svg"
import type { Lang } from "@/SysCore/i18n/lang";
export const PerformancesPage = (props: { lang: Lang }) => {
	return (
		<section className="Performances_section + Layout_Padding_4_top + Layout_Padding_1_bottom + bg-custom-Customize_color" style={{ backgroundImage: `url(${bgImg})`, }}>
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
