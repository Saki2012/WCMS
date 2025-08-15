using WCMS.SysCore.Model;

namespace WCMS.Features.SystemSetting.SiteMenuSetting
{

    public class SiteMenuSet
    {
 
    }

    public class SiteMenu_IndexModel:MasterDataModel
    {
        /// <summary>
        /// 首頁代碼
        /// </summary>
        public string ? SideIndex { get; set; }
    }

    public class SiteMenu_Item
    {
        public string? SideIndex { get; set; }

        public string? ItemId { get; set; }

        public string? ParentItemId { get; set; }

        public string ItemType { get; set; } //Url Or Func
    }


    public class SiteMenu_Url
    {
        public string? SideIndex { get; set; }

        public string? UrlName { get; set; } //要有中英文

        public byte RedirectType { get; set; } //0:無,1:內部,2:外部

        public string? RedirectUrl { get; set; } //內部或外部網址
        
        public bool IsNewWindow { get; set; } //是否在新視窗開啟

        public byte IsShowOnMenu { get; set; } //0:不顯示,1:顯示
    }

    public class SiteMenu_Func
    {
        public string? SideIndex { get; set; }
        public string? FuncName { get; set; } //要有中英文
        public byte IsShowOnMenu { get; set; } //0:不顯示,1:顯示
        public string? FuncCode { get; set; } //功能代碼
    }
}
