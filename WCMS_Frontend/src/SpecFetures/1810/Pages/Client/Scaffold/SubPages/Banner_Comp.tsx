

export const Banner_Comp = (props: { bannerUrl: string }) => {
    if (!props.bannerUrl) return <></>
    return (
        <>
            <section className="SubPage_Section SubPage-TopBanner background-IMG">
                <div className="subpage_banner_wrapper" style={{ backgroundImage: `${props.bannerUrl}` }}>
                    <div className="container-customize2">
                        <div className="banner-content">
                            <div className="content-inner">
                                <div className="titlebar">
                                    <div className="titlebar-inner container">
                                        <h1 className="Big-title">虛擬文字 Virtual text</h1>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}