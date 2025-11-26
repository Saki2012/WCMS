import bgimg from "@/SpecFetures/1816/Assets/Client/images/bg/background-transparent-image_1920x600.png"
import { useCallback, useRef } from "react";

const urlBase = "https://tnua.on.worldcat.org/external-search?queryString=#T#&databaseList=&clusterResults=on&groupVariantRecords=off&stickyFacetsChecked=on&baseScope=wz%3A11833#F#";

export const SearchData = () => {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const handleSearch = useCallback(
		(e: React.FormEvent | React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const inputs = [inputRef.current];
			const activeInput = inputs.find((el) => el && el.offsetParent !== null) ?? inputs[0];
			const raw = activeInput?.value ?? "";
			const query = raw.trim();
			if (!query) return;
			const facets = "";
			const url = urlBase.replace("#T#", encodeURIComponent(query)).replace("#F#", facets);
			window.open(url, "_blank"); // ✅ 固定新開視窗
		}, []);
	return (

		<section className="ResourceSearch_section Layout_Padding_4" style={{ backgroundImage: `url(${bgimg})` }}>
			<div className="Mask-DivBox">
				<div className="customizeBox">
					<div className="circle-1 iMG-Shape-0" />
					<div className="container-customize2">
						<div className="Form_Search_DIV">
							<ul className="tablist_nav nav nav-tabs nav-fill" id="findTab" role="tablist">
								<li className="li_item nav-item">
									<a aria-controls="search_01" aria-selected="true" className="alink nav-link active show" data-bs-toggle="tab" href="#search_01" id="search_tab_01" role="tab" tabIndex={0}>
										館藏整合查詢
									</a>
								</li>
								<li className="li_item nav-item">
									<a aria-controls="search_02" aria-selected="false" target="_blank" className="alink nav-link" href="https://tnua.on.worldcat.org/atoztitles/browse/collections" id="search_tab_02" role="button" tabIndex={0}>
										資料庫列表
									</a>
								</li>
								<li className="li_item nav-item">
									<a aria-controls="search_03" aria-selected="false" target="_blank" className="alink nav-link" href="https://tnua.on.worldcat.org/atoztitles/browse/journals" id="search_tab_03" role="button" tabIndex={0}>
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
										<form className="row align-items-start no-gutters" onSubmit={handleSearch}>
											<div className="b-main-filter__main col-lg px-0">
												<div className="b-main-filter__inner row no-gutters">
													<div className="float-md-left float-sm-none">
														<input ref={inputRef} className="Searchform-control" defaultValue="" id="" placeholder="請輸入查詢資訊 ..." tabIndex={0} type="text" />
													</div>
												</div>
											</div>
											<div className="col-lg-auto mt-xl-0 mt-lg-0 mt-md-0 mt-sm-2 mt-2">
												<button className="Search_btn btn" tabIndex={0} title="搜尋" type="submit">
													Search
												</button>
											</div>
										</form>
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
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
