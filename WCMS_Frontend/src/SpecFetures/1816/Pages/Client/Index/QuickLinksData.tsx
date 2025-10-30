export const QuickLinksData = () => {
	return (


		<div>
			<section className="Event_section owl-box Layout_Padding_3_top Layout_Padding_5_bottom">
				<div className="Mask-DivBox">
					<div className="customizeBox">
						<div className="circle-1 iMG-Shape-4" />
						<div className="container-customize2">
							<div className="row">
								<div className="col-12">
									<div className="content-box px-0 mb-5">
										<div className="DIV-singleBox d-none">
											<div className="control-singlebox">
												<a
													aria-label="圖片輪播播放中，點擊暫停"
													aria-pressed="true"
													className="toggle ms-1"
													href="javascript:void(0);"
													id="Event_toggle"
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
										<div className="owl-carousel owl-theme" id="Event_owl_carousel">
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
																		src="/images/media_reports/images_01_960x960.jpg"
																	/>
																</picture>
																<div className="Description-Area-content">
																	<div className="hidden-TextArea">
																		<div className="Des-tit">
																			北藝大專屬的數位博物館，匯聚時光印記，敘說北藝大的歷史與此刻。
																		</div>
																	</div>
																</div>
															</div>
														</figure>
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
												title="更多專區連結"
												type="button">
												<div className="BtnBox">
													<span>更多專區連結</span>
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
						"        $(document).ready(function() {          var owl = $('#Event_owl_carousel');          var isPlaying = true;           owl.owlCarousel({            items: 3,            loop: false,              dots: false,            nav: true,            margin: 30,            autoplay: false,             autoplayTimeout: 1000,            autoplayHoverPause: true,            responsive: {              0: { items: 2 },              575: { items: 2 },              767: { items: 2 },              991: { items: 3 },              1199: { items: 3 }            }          });          $('#Event_toggle').click(function() {            if (isPlaying) {              owl.trigger('stop.owl.autoplay');              isPlaying = false;            } else {              owl.trigger('play.owl.autoplay', [5000]);              isPlaying = true;            }            updateToggleButton();          });          function updateToggleButton() {            const $toggle = $('#Event_toggle');            const $iconBox = $toggle.find('.control-toggle');            const $srText = $toggle.find('.sr-only');            $iconBox.removeClass('control-play-icon control-pause-icon');            if (isPlaying) {              $toggle.attr('aria-pressed', 'true').attr('aria-label', '圖片輪播播放中，點擊暫停');              $iconBox.addClass('control-pause-icon');              $srText.text('圖片輪播播放中，點擊暫停');            } else {              $toggle.attr('aria-pressed', 'false').attr('aria-label', '圖片輪播已暫停，點擊播放');              $iconBox.addClass('control-play-icon');              $srText.text('圖片輪播已暫停，點擊播放');            }          }          updateToggleButton();        });      ",
				}}
				type="text/javascript"
			/>
		</div>

	);
};
