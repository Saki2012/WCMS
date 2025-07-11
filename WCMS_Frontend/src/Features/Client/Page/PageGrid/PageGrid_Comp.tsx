import SearchBarComp from '../../../../SysCore/Components/SearchBar/SearchBar_Comp'
import GridComp from '../../../../SysCore/Components/Grid/Grid_Comp'
const PageGridComp =() => {
    return (
      <div className="col-lg-10 col-md-12 col-sm-12 col-12" id="div_ThirdMenu">
        <div className='col-sm-12 col-12 px-0 page-righttopmenu'></div>
        <div className='col-sm-12 col-12 px-0'>
          <hr className="mt-1 mb-4"></hr>
          <SearchBarComp></SearchBarComp>
          <GridComp></GridComp>
        </div>
      </div>
    );
}
export default PageGridComp







// <div class="col-lg-10 col-md-12 col-sm-12 col-12" id="div_ThirdMenu">
//     <asp:Panel ID="ContentThirdMenu" runat="server" CssClass="ContentThirdMenu">
//         <asp:PlaceHolder ID="PlaceHolder_ThirdMenu" runat="server"></asp:PlaceHolder>

//         <!-- // 右邊第三層選單區 // -->
//         <script type="text/javascript">
//             $(document).ready(function () {
//                 $('button[data-target="#navbarSupportedContent"]').on('click', function () {
//                     var nav_button = $('button.navbar-toggler').not('[data-target="#navbarSupportedContent"]');
//                     for (var i = 0; i < nav_button.length; i++) {
//                         if (nav_button[i].attributes["aria-expanded"].nodeValue == "true") {
//                             nav_button[i].click();
//                         }
//                     }
//                 });

//                 $('button[data-target="#page-navbarSupportedContent"]').on('click', function () {
//                     var nav_button = $('button.navbar-toggler').not('[data-target="#page-navbarSupportedContent"]');
//                     for (var i = 0; i < nav_button.length; i++) {
//                         if (nav_button[i].attributes["aria-expanded"].nodeValue == "true") {
//                             nav_button[i].click();
//                         }
//                     }
//                 });
//             });
//         </script>

//         <script type="text/javascript">
//             $(document).ready(function () {
//                 $("#page-main-menu.sm-subpage.sm-subpage-clean li .h2menu").find(function () {
//                     $("a.active").addClass("active");
//                 });
//             });
//         </script>
//         <!-- // 右邊第三層選單區 // -->
//     </asp:Panel>

//     <asp:Panel ID="ContentConentA" runat="server" CssClass="ContentConentA">

//         <hr class="mt-1 mb-4" />

//         <asp:ContentPlaceHolder ID="ContentPlaceConentA" runat="server">
//         </asp:ContentPlaceHolder>
//     </asp:Panel>

//     <asp:Panel ID="ContentConentB" runat="server" CssClass="ContentConentB">

//         <hr class="mt-1 mb-4" />

//         <asp:ContentPlaceHolder ID="ContentPlaceContentB" runat="server">
//         </asp:ContentPlaceHolder>
//     </asp:Panel>

// </div>