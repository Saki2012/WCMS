import BannerComp from '../../../../SysCore/Components/Banner/Banner_Comp'
import BreadCrumbComp from '../../../../SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import SubMenuComp from '../../../../SysCore/Components/MenuList/SubMenu_Comp'
import PageGridComp from '../../../../Features/Client/Page/PageGrid/PageGrid_Comp'
import PageContent from '../../../../Features/Client/Page/PageContent/PageContent_Comp'
const SubContent = () => {
  return (
    <>
      <BannerComp item={{Title:"最新公告(param)", SrcImg:"/Legacy/Images/banner/subpage_banner_img_1920x550.jpg"}}></BannerComp>
      <>
        {/* Container
            - BreadCrumb (頁面導覽)
            - Menu
            - Grid
              - Search
              - grid
              - Pager
        */}
        <BreadCrumbComp></BreadCrumbComp>
        <SubMenuComp></SubMenuComp>
        <PageGridComp></PageGridComp>
        {/* <PageContent></PageContent> */}
      </>
    </>
  );
};

export default SubContent;