export const QuickLinksData = () => {
	return (

		<div>
			<section className="Links_section owl-box Layout_Padding_3_top Layout_Padding_1_bottom">
				<div className="Mask-DivBox">
					<div className="customizeBox">
						<div className="container-customize2">
							<div className="row">
								<div className="col-12">
									<div className="headDiv mb-sm-5 mb-4">
										<span className="headDiv-txt">快速連結</span>
										<span className="headDiv-subtxt">Links</span>
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
													id="Links_toggle"
													tabIndex={0}
													title="暫停">
													<div className="control-toggle control-pause-icon">
														<span className="sr-only">
															圖片輪播播放中，點擊暫停
														</span>
													</div>
												</a>
											</div>
										</div>
										<div className="owl-carousel owl-theme" id="Links_owl_carousel">
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<div className="Qlink-item">
															<div className="Img_Div w-100">
																<div className="Qlinkimg-outer">
																	<img
																		alt="class image"
																		src="/images/links/links_01_300x93.jpg"
																	/>
																</div>
															</div>
															<div className="go_label d-none">
																<i aria-hidden="true" className="fa fa-link">
																	<span className="sr-only">連結符號</span>
																</i>
															</div>
															<div className="Content_Div">
																<div className="box_content">
																	<div className="tit-text">
																		圖書館2019-2022電子報
																	</div>
																</div>
															</div>
														</div>
													</div>
												</a>
											</div>
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<div className="Qlink-item">
															<div className="Img_Div w-100">
																<div className="Qlinkimg-outer">
																	<img
																		alt="class image"
																		src="/images/links/links_02_300x93.jpg"
																	/>
																</div>
															</div>
															<div className="go_label d-none">
																<i aria-hidden="true" className="fa fa-link">
																	<span className="sr-only">連結符號</span>
																</i>
															</div>
															<div className="Content_Div">
																<div className="box_content">
																	<div className="tit-text">
																		藝術資料授權的注意事項
																	</div>
																</div>
															</div>
														</div>
													</div>
												</a>
											</div>
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<div className="Qlink-item">
															<div className="Img_Div w-100">
																<div className="Qlinkimg-outer">
																	<img
																		alt="class image"
																		src="/images/links/links_00_300x93.jpg"
																	/>
																</div>
															</div>
															<div className="go_label d-none">
																<i aria-hidden="true" className="fa fa-link">
																	<span className="sr-only">連結符號</span>
																</i>
															</div>
															<div className="Content_Div">
																<div className="box_content">
																	<div className="tit-text">北藝大官網</div>
																</div>
															</div>
														</div>
													</div>
												</a>
											</div>
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<div className="Qlink-item">
															<div className="Img_Div w-100">
																<div className="Qlinkimg-outer">
																	<img
																		alt="class image"
																		src="/images/links/links_00_300x93.jpg"
																	/>
																</div>
															</div>
															<div className="go_label d-none">
																<i aria-hidden="true" className="fa fa-link">
																	<span className="sr-only">連結符號</span>
																</i>
															</div>
															<div className="Content_Div">
																<div className="box_content">
																	<div className="tit-text">
																		圖書館簡介 [ 動畫版 ]
																	</div>
																</div>
															</div>
														</div>
													</div>
												</a>
											</div>
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
												title="更多連結"
												type="button">
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
			<script
				dangerouslySetInnerHTML={{
					__html:
						"        $(document).ready(function() {          var owl = $('#Links_owl_carousel');          var isPlaying = true; // 🔧 補上這一行          owl.owlCarousel({            items: 4,            loop: false, //true or false            dots: false,            nav: true,            margin: 30,            autoplay: false, //true or false            autoplayTimeout: 1000,            autoplayHoverPause: true,            responsive: {              0: { items: 2 },              575: { items: 2 },              767: { items: 2 },              991: { items: 3 },              1199: { items: 4 }            }          });          // 播放 / 暫停切換按鈕邏輯          $('#Links_toggle').click(function() {            if (isPlaying) {              owl.trigger('stop.owl.autoplay');              isPlaying = false;            } else {              owl.trigger('play.owl.autoplay', [5000]);              isPlaying = true;            }            updateToggleButton();          });          function updateToggleButton() {            const $toggle = $('#Links_toggle');            const $iconBox = $toggle.find('.control-toggle');            const $srText = $toggle.find('.sr-only');            // 先清空可能存在的 class            $iconBox.removeClass('control-play-icon control-pause-icon');            if (isPlaying) {              $toggle.attr('aria-pressed', 'true').attr('aria-label', '圖片輪播播放中，點擊暫停');              $iconBox.addClass('control-pause-icon');              $srText.text('圖片輪播播放中，點擊暫停');            } else {              $toggle.attr('aria-pressed', 'false').attr('aria-label', '圖片輪播已暫停，點擊播放');              $iconBox.addClass('control-play-icon');              $srText.text('圖片輪播已暫停，點擊播放');            }          }          // 初始化狀態          updateToggleButton();        });      ",
				}}
				type="text/javascript"
			/>
		</div>


	);
};
