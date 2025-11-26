
import { LinkData } from '@/SpecFetures/1817/Pages/Client/Index/Section/LinkData'
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { useBannerListData } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Hook";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import clsx from "clsx";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
type BannerSet = components["schemas"]["BannerSet_DTO"]
const emptyData: BannerSet = {
  Banner: {},
  BannerDetail: [
    {
      RowId: 1,
      Validate_Start: "",
      Validate_End: "",
      PicSrcId: "",
      FontColor: "",
    }
  ],
  BannerDetailInfo: [
    {
      ParentRowId: 1,
      RowId: 1,
      Lang: "zh-tw",
      Title: "",
      Content: "",
      URL: "",
      URL_Open: 1,
    },
    {
      ParentRowId: 1,
      RowId: 2,
      Lang: "en",
      Title: "",
      Content: "",
      URL: "",
      URL_Open: 1,
    }
  ]
}


export const CarouselData = () => {
  const usebannerList = useBannerListData(`${SchemaFields.BannerFields.BannerId} = Banner20251117001`)
  const bannerInternal = usebannerList.rawData?.[0]?.Banner?.InternalId ?? ""
  const useBanner = useFetchFormData<BannerSet>(BannerSliderProvider(), bannerInternal, emptyData)
  const loadingList = [useBanner.isLoading, usebannerList.isLoading]
  const errorList = [useBanner.error, usebannerList.error]
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


    <section className="TraditionArt_section + Layout_Padding_3_top + bg-custom-Customize_color">
      <div className="Mask-DivBox">
        <div className="customizeBox">
          <div className="Top_Div_All">
            <div className="Top_inner">
              <div className="LineIMG-0 iMG-Shape-0" />
              <p className="P_head">
                <span>與世界交朋友</span>
                <br />
                <span>從臺灣的傳統音樂出發，</span>
              </p>
              <div className="Top_title_wrap">
                <div className="Top_Font_Img">
                  <img
                    alt="傳統 . 藝術"
                    src="/images/Tradition_and_Art_900x210.svg"
                  />
                </div>
              </div>
              <div className="Top_banner_wrap">
                <div className="Carousel_slide_section">
                  <div className="carousel slide" id="B5_default_carousel">
                    <div className="control-singlebox">
                      <div className="control-toggle">
                        <a
                          aria-label="暫停"
                          aria-pressed="true"
                          className="carousel-toggle-btn"
                          href="javascript:void(0);"
                          id="toggleCarousel"
                          role="button"
                          tabIndex={0}
                          title="暫停"
                          type="button">
                          <span className="control-icon pause" />
                          <span className="sr-only">暫停</span>
                        </a>
                      </div>
                    </div>
                    <div className="carousel-inner">

                      {sortedDetails.map((p, i) => {
                        const alt = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Title ?? ""
                        //const date = formatDate(p.Validate_Start || "")
                        //const content = useBanner.data?.BannerDetailInfo?.find(x => x.BannerId === p.BannerId && x.ParentRowId === p.RowId && x.Lang === "zh-tw")?.Content ?? ""

                        return (
                          <div key={i} className={clsx("carousel-item", i === 0 ? "active" : "")} data-bs-interval="5000">
                            <img src={`${FileManagementAPI.PREVIEW_URL}/${p.PicSrcId}`}
                              className="d-block w-100"
                              alt={alt}
                            />
                          </div>
                        )
                      })}


                    </div>
                    <div className="carousel-indicators">
                      <a href="javascript:void(0);" tabIndex={0} title="上一張">
                        <button
                          aria-current="true"
                          aria-label="Slide 1"
                          className="active"
                          data-bs-slide-to="0"
                          data-bs-target="#B5_default_carousel"
                          type="button"
                        />
                      </a>
                      <a href="javascript:void(0);" tabIndex={0} title="上一張">
                        <button
                          aria-label="Slide 2"
                          className=""
                          data-bs-slide-to="1"
                          data-bs-target="#B5_default_carousel"
                          type="button"
                        />
                      </a>
                      <a href="javascript:void(0);" tabIndex={0} title="上一張">
                        <button
                          aria-label="Slide 3"
                          className=""
                          data-bs-slide-to="2"
                          data-bs-target="#B5_default_carousel"
                          type="button"
                        />
                      </a>
                    </div>
                    <div className="carousel_btn-icon-prev">
                      <a
                        data-bs-slide="prev"
                        data-bs-target="#B5_default_carousel"
                        href="javascript:void(0);"
                        role="button"
                        tabIndex={0}
                        title="上一張"
                        type="button">
                        <div className="carousel-control-prev">
                          <span
                            aria-hidden="true"
                            className="carousel-control-prev-icon"
                          />
                          <span className="sr-only">Previous</span>
                        </div>
                      </a>
                    </div>
                    <div className="carousel_btn-icon-next">
                      <a
                        data-bs-slide="next"
                        data-bs-target="#B5_default_carousel"
                        href="javascript:void(0);"
                        role="button"
                        tabIndex={0}
                        title="上一張"
                        type="button">
                        <div className="carousel-control-next">
                          <span
                            aria-hidden="true"
                            className="carousel-control-next-icon"
                          />
                          <span className="sr-only">Next</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <LinkData />
            </div>
          </div>
        </div>
      </div>
    </section>



  );
};





const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  //const month = date.toLocaleString("en-US", { month: "short" });
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();
  return { day, month, year };
}