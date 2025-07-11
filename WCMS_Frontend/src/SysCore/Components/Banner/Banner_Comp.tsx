// import SubPageTitle from '@/SysCore/Components/Banner/Banner_Data'

// import SubPageTitle from '../../../../src/SysCore/Components/Banner/Banner_Data'
export type SubPageTitle = {
  Title: string;
  SrcImg: string;
};

interface Props {
  item: SubPageTitle;
}

export default function BannerComp({item}: Props) {
    return (
        <div className='container-fluid-customize px-0'>
            <div className='subpage_banner_wrapper' style={{backgroundImage: `url(${item.SrcImg})`}}>
                <div className="container-customize1">
                    <div className="banner-content">
                        <div className="content-inner">
                            <div className="titlebar">
                                <div className="titlebar-inner container">
                                    <div className="Big-title"> {item.Title} </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}