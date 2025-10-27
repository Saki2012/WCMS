export const CollectionsData = () => {
	return (


		<div>
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
														<span className="sr-only">
															圖片輪播播放中，點擊暫停
														</span>
													</div>
												</a>
											</div>
										</div>
										<div
											className="owl-carousel owl-theme"
											id="Collections_owl_carousel">
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="js_method();return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<figure className="card_figure">
															<div className="card_image_link">
																<picture>
																	<img
																		alt=""
																		className="card_image"
																		src="/images/collections/collections_IMG_05.jpg"
																	/>
																</picture>
															</div>
														</figure>
														<div className="txtarea">
															<div className="card_catinfo">
																<span className="card_catname">
																	<span className="mx-1">資源指南</span>
																</span>
															</div>
															<div className="card_info">
																<span className="card_title">影音平台</span>
															</div>
														</div>
													</div>
												</a>
											</div>
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="js_method();return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<figure className="card_figure">
															<div className="card_image_link">
																<picture>
																	<img
																		alt=""
																		className="card_image"
																		src="/images/collections/collections_IMG_06.jpg"
																	/>
																</picture>
															</div>
														</figure>
														<div className="txtarea">
															<div className="card_catinfo">
																<span className="card_catname">
																	<span className="mx-1">資源指南</span>
																</span>
															</div>
															<div className="card_info">
																<span className="card_title">電子書架</span>
															</div>
														</div>
													</div>
												</a>
											</div>
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="js_method();return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<figure className="card_figure">
															<div className="card_image_link">
																<picture>
																	<img
																		alt=""
																		className="card_image"
																		src="/images/collections/collections_IMG_04.jpg"
																	/>
																</picture>
															</div>
														</figure>
														<div className="txtarea">
															<div className="card_catinfo">
																<span className="card_catname">
																	<span className="mx-1">新進館藏</span>
																</span>
															</div>
															<div className="card_info">
																<span className="card_title">新進期刊雜誌</span>
															</div>
														</div>
													</div>
												</a>
											</div>
											<div className="item">
												<a
													href="javascript:void(0);"
													//onclick="js_method();return false;"
													tabIndex={0}
													target="_self"
													title="">
													<div className="wrapper_box">
														<figure className="card_figure">
															<div className="card_image_link">
																<picture>
																	<img
																		alt=""
																		className="card_image"
																		src="/images/collections/collections_IMG_07.jpg"
																	/>
																</picture>
															</div>
														</figure>
														<div className="txtarea">
															<div className="card_catinfo">
																<span className="card_catname">
																	<span className="mx-1">新進館藏</span>
																</span>
															</div>
															<div className="card_info">
																<span className="card_title">新進圖書視聽</span>
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
			<script
				dangerouslySetInnerHTML={{
					__html:
						"        $(document).ready(function() {          var owl = $('#Collections_owl_carousel');          var isPlaying = true; // 🔧 補上這一行          owl.owlCarousel({            items: 4,            loop: false, //true or false            dots: false,            nav: true,            margin: 30,            autoplay: false, //true or false            autoplayTimeout: 5000,            autoplayHoverPause: true,            responsive: {              0: { items: 2 },              575: { items: 2 },              767: { items: 2 },              991: { items: 3 },              1199: { items: 4 }            }          });          // 播放 / 暫停切換按鈕邏輯          $('#Collections_toggle').click(function() {            if (isPlaying) {              owl.trigger('stop.owl.autoplay');              isPlaying = false;            } else {              owl.trigger('play.owl.autoplay', [5000]);              isPlaying = true;            }            updateToggleButton();          });          function updateToggleButton() {            const $toggle = $('#Collections_toggle');            const $iconBox = $toggle.find('.control-toggle');            const $srText = $toggle.find('.sr-only');            // 先清空可能存在的 class            $iconBox.removeClass('control-play-icon control-pause-icon');            if (isPlaying) {              $toggle.attr('aria-pressed', 'true').attr('aria-label', '圖片輪播播放中，點擊暫停');              $iconBox.addClass('control-pause-icon');              $srText.text('圖片輪播播放中，點擊暫停');            } else {              $toggle.attr('aria-pressed', 'false').attr('aria-label', '圖片輪播已暫停，點擊播放');              $iconBox.addClass('control-play-icon');              $srText.text('圖片輪播已暫停，點擊播放');            }          }          // 初始化狀態          updateToggleButton();        });      ",
				}}
				type="text/javascript"
			/>
		</div>

	);
};
