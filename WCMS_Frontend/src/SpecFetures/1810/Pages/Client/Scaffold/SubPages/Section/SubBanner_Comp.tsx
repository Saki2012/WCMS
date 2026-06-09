// #region Section
const SubBannerComp = ({ title, srcImg }: { title: string; srcImg: string; }) =>
{
    return (
        <div className="container-fluid-customize px-0">
            <div className="subpage_banner_wrapper" style={{ backgroundImage: `url(${srcImg})` }}>
                <div className="container-customize1">
                    <div className="banner-content">
                        <div className="content-inner">
                            <div className="titlebar">
                                <div className="titlebar-inner container">
                                    <div className="Big-title">{title}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
export default SubBannerComp;
// #endregion
