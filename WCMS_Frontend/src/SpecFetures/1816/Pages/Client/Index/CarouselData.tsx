import bgImg from '@/SpecFetures/1816/Assets/Client/images/bg/background-transparent-image_1920x600.png'

export const CarouselData = () => {
	return (
		<div>
			<section className="Link-icons_section Layout_Padding_4_bottom" style={{ backgroundImage: `url(${bgImg})` }}>
				<div className="Mask-DivBox">
					<div className="customizeBox">
						<div className="container-customize2">
							<div className="Link-icons-pos">
								<div className="content-box px-0">
									<div className="swiper" id="icon_area">
										<div className="swiper-wrapper">
											<div className="swiper-slide">
												<div className="item">
													<a
														href="javascript:void(0);"
														//onclick="js_method();return false;"
														tabIndex={0}
														target="_blank"
														title="">
														<div className="icon-wrapper">
															<div className="icon-area">
																<div className="icon-type-image">
																	<img
																		alt=""
																		src="/images/links/Area_Links_icon/links_01_W_100x100_icon.svg"
																	/>
																</div>
															</div>
															<div className="tit-contents">
																<div className="Link-icons-title">借閱紀錄</div>
															</div>
														</div>
													</a>
												</div>
											</div>
											<div className="swiper-slide">
												<div className="item">
													<a
														href="javascript:void(0);"
														//onclick="js_method();return false;"
														tabIndex={0}
														target="_blank"
														title="">
														<div className="icon-wrapper">
															<div className="icon-area">
																<div className="icon-type-image">
																	<img
																		alt=""
																		src="/images/links/Area_Links_icon/links_02_W_100x100_icon.svg"
																	/>
																</div>
															</div>
															<div className="tit-contents">
																<div className="Link-icons-title">館際合作</div>
															</div>
														</div>
													</a>
												</div>
											</div>
											<div className="swiper-slide">
												<div className="item">
													<a
														href="javascript:void(0);"
														//onclick="js_method();return false;"
														tabIndex={0}
														target="_blank"
														title="">
														<div className="icon-wrapper">
															<div className="icon-area">
																<div className="icon-type-image">
																	<img
																		alt=""
																		src="/images/links/Area_Links_icon/links_04_W_100x100_icon.svg"
																	/>
																</div>
															</div>
															<div className="tit-contents">
																<div className="Link-icons-title">
																	論文比對/上傳
																</div>
															</div>
														</div>
													</a>
												</div>
											</div>
											<div className="swiper-slide">
												<div className="item">
													<a
														href="javascript:void(0);"
														//onclick="js_method();return false;"
														tabIndex={0}
														target="_blank"
														title="">
														<div className="icon-wrapper">
															<div className="icon-area">
																<div className="icon-type-image">
																	<img
																		alt=""
																		src="/images/links/Area_Links_icon/links_05_W_100x100_icon.svg"
																	/>
																</div>
															</div>
															<div className="tit-contents">
																<div className="Link-icons-title">利用教學</div>
															</div>
														</div>
													</a>
												</div>
											</div>
											<div className="swiper-slide">
												<div className="item">
													<a
														href="javascript:void(0);"
														//onclick="js_method();return false;"
														tabIndex={0}
														target="_blank"
														title="">
														<div className="icon-wrapper">
															<div className="icon-area">
																<div className="icon-type-image">
																	<img
																		alt=""
																		src="/images/links/Area_Links_icon/links_07_W_100x100_icon.svg"
																	/>
																</div>
															</div>
															<div className="tit-contents">
																<div className="Link-icons-title">電子資源</div>
															</div>
														</div>
													</a>
												</div>
											</div>
											<div className="swiper-slide">
												<div className="item">
													<a
														href="javascript:void(0);"
														//onclick="js_method();return false;"
														tabIndex={0}
														target="_blank"
														title="">
														<div className="icon-wrapper">
															<div className="icon-area">
																<div className="icon-type-image">
																	<img
																		alt=""
																		src="/images/links/Area_Links_icon/links_06_W_100x100_icon.svg"
																	/>
																</div>
															</div>
															<div className="tit-contents">
																<div className="Link-icons-title">常見問題</div>
															</div>
														</div>
													</a>
												</div>
											</div>
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
			<script
				dangerouslySetInnerHTML={{
					__html:
						"        var Eventswiper = new Swiper('#icon_area', {          direction: 'horizontal',   // 水平顯示          //loop: true,                // 允許循環切換          //autoplay: {            //delay: 1000,             // 每5秒自動播放            //disableOnInteraction: false,  // 用戶互動後，仍然繼續自動播放            //pauseOnMouseEnter: false, // Hover 時暫停 autoplay，離開時繼續          //},                      slidesPerView: 6,          // 預設顯示2個項目          spaceBetween: 0,          // 項目之間的間距          breakpoints: {            768: {              slidesPerView: 6,      // 當寬度大於768px時顯示3個項目            },            576: {              slidesPerView: 5,      // 當寬度大於0px時顯示2個項目            },            480: {              slidesPerView: 4,      // 當寬度大於0px時顯示2個項目            },            0: {              slidesPerView: 3,      // 當寬度大於0px時顯示2個項目            }          },          navigation: {            nextEl: '.swiper-next',  // 下一個按鈕            prevEl: '.swiper-prev',  // 上一個按鈕          },          pagination: {            el: '.swiper-pagination',            clickable: false,          // 允許點擊小點來跳轉          },          draggable: true,            // 允許拖曳        });        //const Linkswiper = document.querySelector('#Links').swiper        // 繼續自動播放        //document.querySelector('#icon_area_start').addEventListener('click', function () {          //Linkswiper.autoplay.start(); // Start autoplay        //});        // 停止自動播放        //document.querySelector('#icon_area_pause').addEventListener('click', function () {          //Linkswiper.autoplay.stop(); // Stop autoplay        //});      ",
				}}
				type="text/javascript"
			/>
		</div>

	);
};
