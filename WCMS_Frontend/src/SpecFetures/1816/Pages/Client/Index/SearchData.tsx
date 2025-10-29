


export const SearchData = () => {
	return (

		<section
			className="ResourceSearch_section Layout_Padding_4"
			style={{
				backgroundImage: "url(images/bg/background-transparent-image_1920x600.png)",
			}}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="circle-1 iMG-Shape-0" />
					<div className="container-customize2">
						<div className="Form_Search_DIV">
							<ul
								className="tablist_nav nav nav-tabs nav-fill"
								id="findTab"
								role="tablist">
								<li className="li_item nav-item">
									<a
										aria-controls="search_01"
										aria-selected="true"
										className="alink nav-link active show"
										data-bs-toggle="tab"
										href="#search_01"
										id="search_tab_01"
										role="tab"
										tabIndex={0}>
										館藏整合查詢
									</a>
								</li>
								<li className="li_item nav-item">
									<a
										aria-controls="search_02"
										aria-selected="false"
										className="alink nav-link"
										data-bs-toggle="tab"
										href="#search_02"
										id="search_tab_02"
										role="tab"
										tabIndex={0}>
										資料庫列表
									</a>
								</li>
								<li className="li_item nav-item">
									<a
										aria-controls="search_03"
										aria-selected="false"
										className="alink nav-link"
										data-bs-toggle="tab"
										href="#search_03"
										id="search_tab_03"
										role="tab"
										tabIndex={0}>
										電子期刊列表
									</a>
								</li>
							</ul>
							<div
								className="Search-content tab-content pt-md-5 pt-sm-4 pt-4"
								id="TabContent">
								<div className="tab-pane fade active show" id="search_01">
									<div className="form_DIV">
										<div className="row align-items-start no-gutters + d-none">
											<div className="col-12">
												<p className="mt-0 mb-3">查詢 ( 取消 )......</p>
											</div>
										</div>
										<div className="row align-items-start no-gutters">
											<div className="b-main-filter__main col-lg px-0">
												<div className="b-main-filter__inner row no-gutters">
													<div className="float-md-left float-sm-none">
														<input
															className="Searchform-control"
															defaultValue=""
															id=""
															placeholder="請輸入查詢資訊 ..."
															tabIndex={0}
															type="text"
														/>
													</div>
												</div>
											</div>
											<div className="col-lg-auto mt-xl-0 mt-lg-0 mt-md-0 mt-sm-2 mt-2">
												<a
													className="Search_btn btn"
													href="javascript:void(0);"
													//onclick="js_method();return false;"
													tabIndex={0}
													title="搜尋"
													type="button">
													Search
												</a>
											</div>
										</div>
										<div className="row align-items-start no-gutters">
											<div className="col-12">
												<p className="mt-3 mb-0">
													查詢本館可用的資源 (
													書籍、影音資料、本校學位論文、資料庫內容、期刊文章 )
												</p>
											</div>
										</div>
									</div>
								</div>
								<div className="tab-pane fade" id="search_02">
									<div className="form_DIV">
										<div className="row align-items-start no-gutters + d-none">
											<div className="col-12">
												<p className="mt-0 mb-3">查詢 ( 取消 )......</p>
											</div>
										</div>
										<div className="row align-items-start no-gutters">
											<div className="b-main-filter__main col-lg px-0">
												<div className="b-main-filter__inner row no-gutters">
													<div className="float-md-left float-sm-none">
														<input
															className="Searchform-control"
															defaultValue=""
															id=""
															placeholder="請輸入查詢資訊 ..."
															tabIndex={0}
															type="text"
														/>
													</div>
												</div>
											</div>
											<div className="col-lg-auto mt-xl-0 mt-lg-0 mt-md-0 mt-sm-2 mt-2">
												<a
													className="Search_btn btn"
													href="javascript:void(0);"
													//onclick="js_method();return false;"
													tabIndex={0}
													title="搜尋"
													type="button">
													Search
												</a>
											</div>
										</div>
										<div className="row align-items-start no-gutters">
											<div className="col-12">
												<p className="mt-3 mb-0">查詢本館有什麼資料庫</p>
											</div>
										</div>
									</div>
								</div>
								<div className="tab-pane fade" id="search_03">
									<div className="form_DIV">
										<div className="row align-items-start no-gutters + d-none">
											<div className="col-12">
												<p className="mt-0 mb-3">查詢 ( 取消 )......</p>
											</div>
										</div>
										<div className="row align-items-start no-gutters">
											<div className="b-main-filter__main col-lg px-0">
												<div className="b-main-filter__inner row no-gutters">
													<div className="float-md-left float-sm-none">
														<input
															className="Searchform-control"
															defaultValue=""
															id=""
															placeholder="請輸入查詢資訊 ..."
															tabIndex={0}
															type="text"
														/>
													</div>
												</div>
											</div>
											<div className="col-lg-auto mt-xl-0 mt-lg-0 mt-md-0 mt-sm-2 mt-2">
												<a
													className="Search_btn btn"
													href="javascript:void(0);"
													//onclick="js_method();return false;"
													tabIndex={0}
													title="搜尋"
													type="button">
													Search
												</a>
											</div>
										</div>
										<div className="row align-items-start no-gutters">
											<div className="col-12">
												<p className="mt-3 mb-0">查詢本館有什麼期刊</p>
											</div>
										</div>
									</div>
								</div>
							</div>
							<script
								dangerouslySetInnerHTML={{
									__html:
										"                                    (function () {                                        var d, w, tabList, h, form, input, urlBase, active, facets, v, r, rt, a, f, select, query;                                        d = document;                                        form = d.getElementById('discovery-search-form');                                        input = d.getElementById('discovery-search');                                        select = d.getElementById('discovery-search-select');                                        urlBase = 'https://tnua.on.worldcat.org/external-search?queryString=#T#&databaseList=&clusterResults=on&groupVariantRecords=off&stickyFacetsChecked=on&baseScope=wz%3A11833#F#';                                        form.addEventListener('submit', function (e) {                                            e.preventDefault();                                            e.stopPropagation();                                            f = '';                                            active = d.querySelector('.material-tab.active-tab');                                            if (active) {                                                facets = JSON.parse(active.getAttribute('data-facets') || '[]');                                                facets.forEach(function (facet) {                                                    console.log(facet);                                                    if (facet.key && facet.value && facet.value !== 'all') {                                                        f += '&' + facet.key + '=' + facet.value;                                                    }                                                })                                            }                                            query = input.value;                                            if (select) {                                                var index = select.options[select.selectedIndex].value                                                if (index !== 'kw') query = select.options[select.selectedIndex].value + ':' + query;                                            }                                            w.open(urlBase.replace('#T#', encodeURIComponent(query)).replace('#F#', f), rt);                                        });                                    })()                                ",
								}}
								type="text/javascript"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>


	);
};
