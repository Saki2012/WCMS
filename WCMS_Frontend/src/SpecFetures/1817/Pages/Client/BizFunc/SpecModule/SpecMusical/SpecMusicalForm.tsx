import type { components } from '@/types/api';
import { useParams } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import ModuleContent, { type ModuleViewCountConfig } from '@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent';
import type { INormNode, INormSite } from '@/Features/Pages/Client/Route/Site-Routing';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import type { ModelDisplaySchema } from '@/types/IApiSchema';
import { PGID, SpecMusicalModelFields, SpecMusicalSetFields } from '@/types/SchemaFields';

// ✅ 新架構：Adapter + LoaderData initial
import { useLoaderData } from 'react-router-dom';
import type { ApiLoaderData } from '@/SysCore/Utils/API/APIAdapter';
import { SpecMusicalAdapter } from '@/SpecFetures/1817/Hooks/BizFunc/SpecModule/SpecMusical/SpecMusical_Api';
import type { SpecMusicalFormLoaderData } from './SpecMusicalForm_Loader';
import type { TryCountDetailViewRequest } from '@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api';

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"]
type SpecMusicalModel = components["schemas"]["SpecMusicalModel_DTO"]
type SpecMusicalPictureList = components["schemas"]["SpecMusicalPictureList_DTO"]
type SpecMusicalSoundList = components["schemas"]["SpecMusicalSoundList_DTO"]

let globalCurrentAudio: HTMLAudioElement | null = null;

interface ISpecMusicalFormProps { site:INormSite; node: INormNode; }

const SpecMusicalForm = (props: ISpecMusicalFormProps) => {
    // 宣告變數
    const { internalId } = useParams();
    const loaderData = useLoaderData() as SpecMusicalFormLoaderData | null;

    const adapter = useMemo(() => SpecMusicalAdapter(), []);
    const safeInternalId = `${internalId ?? ""}`.trim();

    const initialData = useMemo<ApiLoaderData<string, SpecMusicalSet> | null>(() => {
        if (!loaderData?.args?.internalId) return null;
        if (loaderData.args.internalId !== safeInternalId) return null;

        return {
            args: safeInternalId,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.dataRes ?? ({} as SpecMusicalSet),
                SysMessage: [],
            },
        };
    }, [loaderData, safeInternalId]);

    const initialDisplayName = useMemo<ApiLoaderData<null, ModelDisplaySchema[]> | null>(() => {
    if (!loaderData?.res?.displayNameRes) return null;
        return {
            args: null,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.displayNameRes,
                SysMessage: [],
            },
        };
    }, [loaderData]);

    // 執行 function：QueryData / DisplayName（SSR initial → CSR 接手）
    const useData = adapter.hooks.useQueryData({
        internalId: safeInternalId,
        initial: initialData,
        deps: [safeInternalId],
    });

    const useDisplayName = adapter.hooks.useModelDisplayName({
        initial: initialDisplayName,
        deps: [],
    });

    const errorList = [useData.errorText, useDisplayName.errorText];

    const title = useData.data?.SpecMusical?.MusicalName ?? "";
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => {
        const request: TryCountDetailViewRequest = {
            SiteIndex:props.site.siteIndex,
            ProgId:PGID.SpecMusical,
            InternalId:safeInternalId,
        };
        return { mode: "form", contentKey: safeInternalId, request,};}, [safeInternalId]);
    // return（DOM 不改）
    const displaySchema = useMemo<ModelDisplaySchema | null>(() => {
        return Array.isArray(useDisplayName.data)
            ? (useDisplayName.data[0] ?? null)
            : null;
    }, [useDisplayName.data]);
    return (
        <ModuleContent nodeTitle={props.node.title} title={title} isLoading={useData.isLoading} errorList={errorList} viewCountConfig={viewCountConfig}>
            <MainContent data={useData.data ?? undefined} displayName={displaySchema} />
        </ModuleContent>
    )
}

export default SpecMusicalForm

const MainContent = (props: { data?: SpecMusicalSet; displayName: ModelDisplaySchema | null }) => {
    if (!props.data) return null;

    return (
        <>
            <div className="commodity_details_content + Layout_Padding_2_bottom">
                <div className="row">
                    <PicturesComp pics={props.data?.SpecMusicalPictureList ?? []} />
                    <InfoComp info={props.data?.SpecMusical ?? {}} displayName={props.displayName} />
                </div>
            </div>
            <div className="commodity_details_content + Layout_Padding_2_top">
                <div id="commodity_Horizontal" className="H-commodity-nav-tabs-content-box">
                    <SoundComp sounds={props.data?.SpecMusicalSoundList ?? []} />
                </div>
            </div>
        </>
    )
}

const PicturesComp = (props: { pics: SpecMusicalPictureList[] }) => {
    const mainRef = useRef<HTMLDivElement | null>(null);
    const thumbRef = useRef<HTMLDivElement | null>(null);
    const zoomBtnRef = useRef<HTMLAnchorElement | null>(null);
    const srcId = FileManagementAPI.get_Public_Preview_Url(props.pics?.[0].PicSrcId);
    const sortPics = useMemo(() => { return [...props.pics].sort((a, b) => (a.Sort ?? 0) - (b.Sort ?? 0)) }, [props.pics])
    useEffect(() => {
        // 沒有資料或還沒掛上 DOM 直接跳出
        if (!props.pics || props.pics.length === 0) return;
        if (!mainRef.current || !thumbRef.current || !zoomBtnRef.current) return;
        if (typeof window === "undefined") return;

        const win = window as unknown as { jQuery?: any; $?: any };
        const $ = win.jQuery || win.$;
        if (!$ || !$.fn || !$.fn.owlCarousel) {
            // jQuery / OwlCarousel 尚未載入就略過
            return;
        }

        const $main = $(mainRef.current);
        const $thumb = $(thumbRef.current);
        const $zoomBtn = $(zoomBtnRef.current);

        // 如果之前被初始化過，先 destroy 一次避免重複
        if ($main.hasClass("owl-loaded")) $main.trigger("destroy.owl.carousel");
        if ($thumb.hasClass("owl-loaded")) $thumb.trigger("destroy.owl.carousel");

        // 同步縮圖 + 放大按鈕
        const syncPosition = (event: { item?: { index?: number } }) => {
            const index = event?.item?.index ?? 0;

            $thumb.find(".item").removeClass("active").eq(index).addClass("active");

            const thumbsPerPage = 5;
            const start = Math.floor(index / thumbsPerPage) * thumbsPerPage;
            $thumb.trigger("to.owl.carousel", [start, 300, true]);

            const currentImgSrc = $main.find(".item").eq(index).find("img").attr("src");
            if (currentImgSrc) $zoomBtn.attr("href", currentImgSrc);
        };

        // 初始化主輪播
        $main
            .owlCarousel({
                items: 1,
                loop: false,
                dots: false,
                nav: false,
                margin: 10,
                autoplay: false,
                autoplayHoverPause: true,
                smartSpeed: 500,
            })
            .on("changed.owl.carousel", syncPosition);

        // 初始化縮圖輪播
        $thumb.owlCarousel({
            items: 3,
            dots: false,
            margin: 10,
            nav: true,
            smartSpeed: 300,
            responsiveRefreshRate: 100,
            responsive: {
                0: { items: 2 },
                575: { items: 3 },
                767: { items: 2 },
                991: { items: 3 },
                1199: { items: 3 },
            },
        });

        $thumb.find(".item").each(function (this: HTMLElement, index: number) {
            $(this).attr("data-index", index);
        });

        const handleThumbClick = function (this: HTMLElement, e: MouseEvent) {
            e.preventDefault();
            const $item = $(this);
            const index = Number($item.attr("data-index"));
            if (!Number.isNaN(index)) $main.trigger("to.owl.carousel", [index, 300, true]);
        };

        $thumb.on("click", ".item", handleThumbClick);

        $thumb.find(".item").eq(0).addClass("active");

        const firstImgSrc = $main.find(".item").eq(0).find("img").attr("src");
        if (firstImgSrc) $zoomBtn.attr("href", firstImgSrc);

        // 初始化 Venobox（如果有載入）
        const venoFn = ($zoomBtn as any).venobox;
        if (typeof venoFn === "function") {
            venoFn.call($zoomBtn, {
                framewidth: "auto",
                frameheight: "auto",
                titleattr: "title",
                numeratio: true,
                infinigall: true,
            });
        }

        // cleanup
        return () => {
            try {
                $main.trigger("destroy.owl.carousel").off("changed.owl.carousel", syncPosition);
                $thumb.off("click", ".item", handleThumbClick).trigger("destroy.owl.carousel");
            }
            catch {
                // ignore
            }
        };
    }, [sortPics, props.pics]);

    
    return (
        <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-12 col-12">
            <div className="Commodity_Change_Image_Area">
                <div className="commodity_wrapper">
                    <div className="commodity_big_image_box + owl-box">
                        <div className="ZoomIn commodity_ZoomIn_btn">
                            <a ref={zoomBtnRef} href={srcId} className="Btn_zm1 venobox" data-gall="myGallery" type="button" role="button" title="放大圖片">
                                <i className="fas fa-expand-alt"></i>
                                <span className="sr-only">放大圖片</span>
                            </a>
                        </div>
                        <div className="owl-carousel + main-carousel" ref={mainRef}>
                            {sortPics.map((img, index) => {
                                const url = FileManagementAPI.get_Public_Preview_Url(img.PicSrcId);
                                const alt = img.Info ?? "";
                                return (
                                    <div className="item" key={index}>
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img className="card_image" src={url} alt={alt} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="commodity_slider_box + owl-box">
                        <div className="owl-carousel + thumb-carousel" ref={thumbRef} >
                            {sortPics.map((img, index) => {
                                const url = FileManagementAPI.get_Public_Preview_Url(img.PicSrcId);
                                const alt = img.Info ?? "";
                                return (
                                    <div className="item" key={index}>
                                        <img src={url} alt={alt} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const InfoComp = (props: { info: SpecMusicalModel; displayName: ModelDisplaySchema | null }) => {
    const columns = props.displayName?.Tables?.find(p => p.TableId === SpecMusicalSetFields.SpecMusical)?.Columns ?? [];
    const displayCol = [
        SpecMusicalModelFields.Specification,
        SpecMusicalModelFields.Headstock,
        SpecMusicalModelFields.Backboard,
        SpecMusicalModelFields.ScaleLength,
        SpecMusicalModelFields.Bridge,
        SpecMusicalModelFields.BodyForm,
        SpecMusicalModelFields.Material
    ];

    const specifications = displayCol.map((colId) => {
        const colMeta = columns.find(c => c.ColumnId === colId);
        const fieldKey = colId as keyof SpecMusicalModel;
        const rawValue = props.info[fieldKey];
        return { label: colMeta?.ColumnDisplayName ?? colId, value: rawValue == null ? "" : String(rawValue) };
    });

    const [isOpen, setIsOpen] = useState(false);

    const toggleDescription = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsOpen(prev => !prev);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(prev => !prev);
        }
    };

    return (
        <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-12 col-12 ">
            <div className="details_RightContent">
                <div className="Specifications">
                    <ul>
                        {specifications.map((spec, index) => (
                            <li key={index}>
                                <div className="list-group-item">
                                    <span className="mr-2">{spec.label}：</span>
                                    {spec.value}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="Description_Text + mb-5">
                    <div className="open_wrapper">
                        <div className={`message_text${isOpen ? " open" : ""}`}>
                            <span>
                                {props.info.Info}
                            </span>
                        </div>
                        <a className={`label_btn${isOpen ? " active" : ""}`} type="button" role="button"
                            aria-label={isOpen ? "[收合全文]" : "[全文展開]"}
                            title={isOpen ? "[ 收合全文 ]" : "[ 全文展開 ]"} tabIndex={0}
                            onClick={toggleDescription} onKeyDown={handleKeyDown}>
                            <span className="sr-only">{isOpen ? "收合全文" : "全文展開"}</span>
                        </a>
                    </div>
                </div>
                <hr className="hr-my-4" />
            </div>
        </div>
    )
}

const SoundComp = (props: { sounds: SpecMusicalSoundList[] }) => {
    return (
        <div className="tab-content" id="H-nav-tabContent">
            <div id="H-navTabs-01" className="tab-pane fade show active" role="tabpanel" aria-labelledby="H-Tabs__01">
                <div className="Spec_title">
                    <i className="fas fa-music"></i>
                    <span className="sr-only">音樂符號</span>
                    <div className="S_tit">{"琵琶音檔"}</div>
                </div>
                <div className="AudioMP3_Display_Area">
                    <div className="audioMP3_content">
                        <div className="row">
                            {props.sounds.map((audio, index) => (
                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 + MP3-Item" key={index}>
                                    <div className="MP3player_AllBox">
                                        <div className="audio-heading">{audio.Info}</div>
                                        <div className="player_Area">
                                            <AudioPlayer src={FileManagementAPI.get_Public_Preview_Url(audio.SoundSrcId)}/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AudioPlayer = (props: { src: string }) => {
    const playerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const root = playerRef.current;
        if (!root) return;

        const audio = root.querySelector("audio") as HTMLAudioElement | null;
        const playToggleBtn = root.querySelector('a[role="button"]') as HTMLAnchorElement | null;
        const currentTimeEl = root.querySelector(".player-time") as HTMLElement | null;
        const durationEl = root.querySelector(".player-time-duration") as HTMLElement | null;
        const progressBar = root.querySelector(".player-bar") as HTMLElement | null;
        const playedBar = root.querySelector(".player-bar-played") as HTMLElement | null;
        const thumb = root.querySelector(".player-thumb") as HTMLElement | null;
        const volumeSlider = root.querySelector(".volume-slider") as HTMLInputElement | null;
        const volumeIcon = root.querySelector(".volume-icon") as HTMLButtonElement | null;
        const volumeLabel = root.querySelector(".volume-label") as HTMLElement | null;

        if (!audio || !playToggleBtn || !currentTimeEl || !durationEl || !progressBar ||
            !playedBar || !thumb || !volumeSlider || !volumeIcon || !volumeLabel) return;

        let isDragging = false;

        const formatTime = (secs: number) => {
            if (!Number.isFinite(secs) || secs < 0) secs = 0;
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
        };

        const updateVolumeIcon = () => {
            const val = audio.volume;
            if (audio.muted || val === 0) {
                volumeIcon.style.backgroundImage = "url('images/audio_mp3/volume-mute_40x40.png')";
            }
            else {
                volumeIcon.style.backgroundImage = "url('images/audio_mp3/volume-up_40x40.png')";
            }
        };

        const togglePlay = () => {
            if (audio.paused) {
                if (globalCurrentAudio && globalCurrentAudio !== audio) {
                    globalCurrentAudio.pause();
                    const prevPlayer = globalCurrentAudio.closest(".audio-player") as HTMLElement | null;
                    if (prevPlayer) prevPlayer.classList.remove("player-playing");
                }
                audio.play();
                root.classList.add("player-playing");
                globalCurrentAudio = audio;
            }
            else {
                audio.pause();
                root.classList.remove("player-playing");
                if (globalCurrentAudio === audio) globalCurrentAudio = null;
            }
        };

        const handleBtnClick = (e: MouseEvent) => {
            e.preventDefault();
            togglePlay();
        };

        const handleBtnKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePlay();
            }
        };

        playToggleBtn.addEventListener("click", handleBtnClick);
        playToggleBtn.addEventListener("keydown", handleBtnKeyDown);

        const handleLoadedMetadata = () => { durationEl.textContent = formatTime(audio.duration); };

        const handleTimeUpdate = () => {
            if (isDragging || !audio.duration) return;
            const ratio = audio.currentTime / audio.duration;
            playedBar.style.width = `${ratio * 100}%`;
            thumb.style.left = `${ratio * 100}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        };

        const handleEnded = () => {
            root.classList.remove("player-playing");
            if (globalCurrentAudio === audio) globalCurrentAudio = null;
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);

        const updatePosition = (clientX: number) => {
            const rect = progressBar.getBoundingClientRect();
            let offsetX = clientX - rect.left;
            if (offsetX < 0) offsetX = 0;
            if (offsetX > rect.width) offsetX = rect.width;

            const ratio = rect.width ? offsetX / rect.width : 0;
            audio.currentTime = ratio * (audio.duration || 0);
            playedBar.style.width = `${ratio * 100}%`;
            thumb.style.left = `${ratio * 100}%`;
        };

        const onProgressMouseDown = (e: MouseEvent) => {
            isDragging = true;
            updatePosition(e.clientX);

            const onMove = (ev: MouseEvent) => updatePosition(ev.clientX);
            const onUp = () => {
                isDragging = false;
                document.removeEventListener("mousemove", onMove);
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp, { once: true });
        };

        const onThumbMouseDown = (e: MouseEvent) => {
            isDragging = true;
            e.preventDefault();

            const onMove = (ev: MouseEvent) => updatePosition(ev.clientX);
            const onUp = () => {
                isDragging = false;
                document.removeEventListener("mousemove", onMove);
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp, { once: true });
        };

        progressBar.addEventListener("mousedown", onProgressMouseDown);
        thumb.addEventListener("mousedown", onThumbMouseDown);

        audio.volume = 1;
        volumeSlider.value = "100";

        const handleVolumeInput = () => {
            audio.volume = Number(volumeSlider.value) / 100;
            audio.muted = false;
            volumeLabel.textContent = `${Math.round(audio.volume * 100)}%`;
            updateVolumeIcon();
        };

        const handleVolumeIconClick = () => {
            audio.muted = !audio.muted;
            updateVolumeIcon();
            volumeLabel.textContent = audio.muted ? "0%" : `${Math.round(audio.volume * 100)}%`;
        };

        volumeSlider.addEventListener("input", handleVolumeInput);
        volumeIcon.addEventListener("click", handleVolumeIconClick);

        updateVolumeIcon();
        volumeLabel.textContent = `${Math.round(audio.volume * 100)}%`;

        return () => {
            playToggleBtn.removeEventListener("click", handleBtnClick);
            playToggleBtn.removeEventListener("keydown", handleBtnKeyDown);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            progressBar.removeEventListener("mousedown", onProgressMouseDown);
            thumb.removeEventListener("mousedown", onThumbMouseDown);
            volumeSlider.removeEventListener("input", handleVolumeInput);
            volumeIcon.removeEventListener("click", handleVolumeIconClick);
            if (globalCurrentAudio === audio) globalCurrentAudio = null;
        };
    }, [props.src]);

    return (
        <div className="audio-player" ref={playerRef}>
            <audio src={props.src} />
            <a type="button" role="button" aria-label="播放/暫停" title="播放/暫停" tabIndex={0}>
                <div className="play-pause-btn">
                    <div className="play-pause-icon"></div>
                </div>
            </a>
            <div className="player-time" aria-live="polite">00:00</div>
            <div className="player-bar" role="slider" aria-label="播放進度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} tabIndex={0}>
                <div className="player-bar-loaded"></div>
                <div className="player-bar-played"></div>
                <div className="player-thumb"></div>
            </div>

            <div className="player-time-duration">00:00</div>

            <div className="volume-control">
                <button className="volume-icon" data-volume="high" aria-label="靜音或取消靜音"></button>
                <input type="range" min={0} max={100} defaultValue={100} step={1} className="volume-slider" aria-label="音量控制" />
                <span className="volume-label" aria-live="polite">
                    100%
                </span>
            </div>
        </div>
    );
};
