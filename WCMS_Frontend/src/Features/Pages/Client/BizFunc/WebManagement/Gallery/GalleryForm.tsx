import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { Lang } from '@/SysCore/i18n/lang';
import ModuleContent from '../../../Scaffold/SubPages/Section/ModuleContent';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import type { components } from '@/types/api';
import GalleryProvider from '@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
type GallerySet = components["schemas"]["GallerySet_DTO"]
const emptyData: GallerySet = {}

const GalleryForm = (props: { theme: IFETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const pvd = useMemo(() => ({ Gallery: GalleryProvider() }), []);
    const useGalleryFormData = useFetchFormData<GallerySet>(pvd.Gallery, internalId, emptyData)
    const loadingList = [useGalleryFormData.isLoading];
    const errorList = [useGalleryFormData.error];
    const title = useGalleryFormData.data?.GalleryInfo?.find(p => p.Lang === props.lang)?.Title ?? "";
    const children = useMemo(() => { return <GalleryFormList key="grid" lang={props.lang} data={useGalleryFormData.data} />; }, [useGalleryFormData.data, props.lang]);
    return (
        <ModuleContent title={title} loadingList={loadingList} errorList={errorList}>
            {children}
        </ModuleContent>
    )
}
export default GalleryForm

const GalleryFormList = (props: { lang: Lang; data: GallerySet }) => {
    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {props.data?.GalleryPhotos?.map((item, idx) => {
                    const infoDt = props.data.GalleryPhotosInfo?.find(p => p.ParentRowId === item.RowId && p.Lang === props.lang)
                    const photoTitle = infoDt?.Title ?? ""
                    const photoUrl = `${FileManagementAPI.PREVIEW_URL}/${item.PicSrcId}`
                    return (
                        <div key={idx} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
                            <article className="cardbox">
                                <div className="card_content">
                                    <figure className="figure_Box">
                                        <a href={photoUrl} className="card_image_link venobox" data-gall="myGallery" title={photoTitle}>
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={photoUrl} alt="" />
                                                </div>
                                            </div>
                                        </a>
                                        <div className="customize_picture_ZoomIn_btn">
                                            <a href={photoUrl} className="QuickView + p_Btn_zm1 venobox" data-gall="myGallery" type="button" role="button" title="放大圖片">
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </a>
                                        </div>
                                    </figure>
                                    <div className="card_titleDiv + mb-md-2 mb-sm-1 mb-0">
                                        <div className="card_subtitle">{photoTitle}</div>
                                    </div>
                                </div>
                            </article>
                        </div>
                    )
                })}
            </div>
        </>
    )
}