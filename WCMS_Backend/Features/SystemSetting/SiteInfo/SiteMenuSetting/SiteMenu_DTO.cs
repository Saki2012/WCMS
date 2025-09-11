using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting
{
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenuSet_DTO : ITSet_DTO
    {
        /// <summary>
        /// 首頁
        /// </summary>
        public SiteMenu_Index_DTO SiteMenu_Index { get; set; } = new();
        /// <summary>
        /// 首頁資訊
        /// </summary>
        public List<SiteMenu_IndexInfo_DTO> SiteMenu_IndexInfo { get; set; } = [];
        /// <summary>
        /// 連結項目
        /// </summary>
        public List<SiteMenu_Item_DTO> SiteMenu_Item { get; set; } = [];
        /// <summary>
        /// 連結標題(多國語言)
        /// </summary>
        public List<SiteMenu_Item_Title_DTO> SiteMenu_Item_Title { get; set; } = [];
        /// <summary>
        /// 超連結
        /// </summary>
        public List<SiteMenu_Item_Url_DTO> SiteMenu_Item_Url { get; set; } = [];
        /// <summary>
        /// 功能模組
        /// </summary>
        public List<SiteMenu_Item_Module_DTO> SiteMenu_Item_Module { get; set; } = [];
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Index_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 首頁代碼
        /// </summary>
        [LibDesc] public string? SiteIndex { get; set; }
        /// <summary>
        /// Goole分析碼
        /// </summary>
        public string GoogleAnalytics { get; set; }
        /// <summary>
        /// 是否啟用站台
        /// </summary>
        public bool Enable { get; set; } = true;
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_IndexInfo_DTO
    {
        /// <summary>
        /// 首頁代碼
        /// </summary>
        public string? SiteIndex { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string? Lang { get; set; }
        /// <summary>
        /// 網站標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string Title { get; set; }
        /// <summary>
        /// 網站描述
        /// </summary>
        [LibDesc()] public string Description { get; set; }
        /// <summary>
        /// Header
        /// </summary>
        public string? SiteHeader { get; set; }
        /// <summary>
        /// Footer
        /// </summary>
        public string? SiteFooter { get; set; }
        /// <summary>
        /// 網站關鍵字
        /// </summary>
        public string Keyword { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_DTO
    {
        /// <summary>
        /// 主站Url，最主要的會是Empty，新的子站則是https://xxx.com/{SiteIndex}
        /// </summary>
        public string? SiteIndex { get; set; }
        /// <summary>
        /// url主鍵
        /// </summary>
        public int? RowId { get; set; }
        /// <summary>
        /// 上層url外鍵(一定會跟著SiteIndex一起)
        /// </summary>
        public int? ParentRowId { get; set; }
        /// <summary>
        /// 當前頁面Url E.x.:AllNews
        /// </summary>
        public string? ItemSiteUrl { get; set; }
        /// <summary>
        /// 完整的Url，整個系統唯一值，後端賦值處理
        /// </summary>
        public string? FullUrl { get; set; }
        /// <summary>
        /// 層級
        /// </summary>
        public byte Level { get; set; }
        /// <summary>
        /// 順序(Key:同Parent底下做排序)
        /// </summary>
        public byte DisplayOrder { get; set; }
        /// <summary>
        /// 屬於function或是url連結?
        /// </summary>
        public MenuUrlType ItemType { get; set; } //Url Or Func
        /// <summary>
        /// 開啟分頁方式
        /// </summary>
        public WindowTarget WindowTarget { get; set; }
        /// <summary>
        /// 是否顯示在清單上
        /// </summary>
        public bool IsShowOnMenu { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Title_DTO
    {
        public string? SiteIndex { get; set; }
        public int? ItemRowId { get; set; }
        public int? RowId { get; set; }
        public string Lang { get; set; }
        public string Title { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Url_DTO
    {
        public string? SiteIndex { get; set; }
        public int? ItemRowId { get; set; }
        public MenuUrlType RedirectType { get; set; } //0:無, 1:外部,2:內部模型功能(直接轉FullUrl、但是是用下拉的看Title/Url)
        public string? RedirectUrl { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Module_DTO
    {
        public string? SiteIndex { get; set; }
        public int? ItemRowId { get; set; }
        public string? BannerId { get; set; }
        public ModulePageType PageType { get; set; }
        public string? ModuleProgId { get; set; } //功能代碼
        public string? ModuleOptions { get; set; }//動態參數，存Json格式
    }
}
