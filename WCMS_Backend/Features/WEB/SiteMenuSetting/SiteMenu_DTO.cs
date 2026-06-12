using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.SiteMenuSetting
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
        [LibDesc(ModelDisplayName.SiteMenu_SiteIndex)] public string? SiteIndex { get; set; }
        /// <summary>
        /// Goole分析碼
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_GoogleAnalytics)] public string? GoogleAnalytics { get; set; }
        /// <summary>
        /// 是否啟用站台
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_Enable)] public bool Enable { get; set; } = true;
        /// <summary>
        /// 預設語系
        /// </summary>
        [LibDesc(ModelDisplayName.Enum_DefaultLang)] public LangCode? DefaultLang { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Enum_SupportLang),StringLength(SysLengthParam.Memo)] public string? SupportLangs { get; set; }

        #region 主子表關聯
        [InverseProperty(nameof(SiteMenu_IndexInfo_DTO._SiteMenu_Index))] public List<SiteMenu_IndexInfo_DTO>? _SiteMenu_IndexInfo { get; set; }
        [InverseProperty(nameof(SiteMenu_Item_DTO._SiteMenu_Index))] public List<SiteMenu_Item_DTO>? _SiteMenu_Item { get; set; }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_IndexInfo_DTO
    {
        /// <summary>
        /// 首頁代碼
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_SiteIndex)] public string? SiteIndex { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
        /// <summary>
        /// 網站標題
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_SiteTitle)] public string? Title { get; set; }
        /// <summary>
        /// 網站描述
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_SiteDescription)] public string? Description { get; set; }
        /// <summary>
        /// 首頁Banner設定
        /// </summary>
        [LibDesc(ModelDisplayName.BannerId)] public string? BannerId { get; set; }
        /// <summary>
        /// Header
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_SiteHeader)] public string? SiteHeader { get; set; }
        /// <summary>
        /// Footer
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_SiteFooter)] public string? SiteFooter { get; set; }
        /// <summary>
        /// 網站關鍵字
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_SiteFooter)] public string? Keyword { get; set; }

        #region 主子表關聯
        public SiteMenu_Index_DTO? _SiteMenu_Index { get; set; }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_DTO
    {
        /// <summary>
        /// 主站Url，最主要的會是Empty，新的子站則是https://xxx.com/{SiteIndex}
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_SiteIndex), StringLength(SysLengthParam.ID)] public string? SiteIndex { get; set; }
        /// <summary>
        /// url主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
        /// <summary>
        /// 上層url外鍵(一定會跟著SiteIndex一起)
        /// </summary>
        public int? ParentRowId { get; set; }
        /// <summary>
        /// 當前頁面Url E.x.:AllNews
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_ItemSiteUrl), StringLength(SysLengthParam.Url)] public string? ItemSiteUrl { get; set; }
        /// <summary>
        /// 完整的Url，整個系統唯一值，後端賦值處理
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_FullUrl), StringLength(SysLengthParam.Url)] public string? FullUrl { get; set; }
        /// <summary>
        /// 層級
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_Level)] public byte Level { get; set; }
        /// <summary>
        /// 順序(Key:同Parent底下做排序)
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_DisplayOrder)] public byte DisplayOrder { get; set; }
        /// <summary>
        /// 屬於function或是url連結?
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_ItemType)] public MenuUrlType ItemType { get; set; } //Url Or Func
        /// <summary>
        /// 開啟分頁方式
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_WindowTarget)] public WindowTarget WindowTarget { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(SiteIndex))] public SiteMenu_Index_DTO? _SiteMenu_Index { get; set; }
        [InverseProperty(nameof(SiteMenu_Item_Title_DTO._SiteMenu_Index))] public List<SiteMenu_Item_Title_DTO>? _SiteMenu_Item_Title { get; set; }
        [InverseProperty(nameof(SiteMenu_Item_Title_DTO._SiteMenu_Index))] public SiteMenu_Item_Url_DTO? _SiteMenu_Item_Url { get; set; }
        [InverseProperty(nameof(SiteMenu_Item_Title_DTO._SiteMenu_Index))] public SiteMenu_Item_Module_DTO? _SiteMenu_Item_Module { get; set; }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Title_DTO
    {
        [LibDesc(ModelDisplayName.SiteMenu_SiteIndex), StringLength(SysLengthParam.ID)] public string? SiteIndex { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId)] public int? ItemRowId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
        [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
        [LibDesc(ModelDisplayName.SiteMenu_MenuTitle), StringLength(SysLengthParam.Title)] public string? Title { get; set; }
        [LibDesc(ModelDisplayName.SiteMenu_IsShowOnMenu)] public bool IsShowOnMenu { get; set; }

        #region 主子表關聯
        public SiteMenu_Item_DTO? _SiteMenu_Index { get; set; }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Url_DTO
    {
        [LibDesc(ModelDisplayName.SiteMenu_SiteIndex)] public string? SiteIndex { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId)] public int? ItemRowId { get; set; }
        [LibDesc(ModelDisplayName.SiteMenu_RedirectType)] public MenuUrlType RedirectType { get; set; } //0:無, 1:外部,2:內部模型功能(直接轉FullUrl、但是是用下拉的看Title/Url)
        [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string? RedirectUrl { get; set; }

        #region 主子表關聯
        public SiteMenu_Item_DTO? _SiteMenu_Index { get; set; }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Module_DTO
    {
        [LibDesc(ModelDisplayName.SiteMenu_SiteIndex), StringLength(SysLengthParam.ID)] public string? SiteIndex { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId)] public int? ItemRowId { get; set; }
        [LibDesc(ModelDisplayName.BannerId), StringLength(SysLengthParam.ID)] public string? BannerId { get; set; }
        [LibDesc(ModelDisplayName.SiteMenu_ItemType)] public ModulePageType PageType { get; set; }
        [LibDesc(ModelDisplayName.SiteMenu_ModuleProgId), StringLength(SysLengthParam.ProgId)] public string? ModuleProgId { get; set; } //功能代碼
        [LibDesc(ModelDisplayName.SiteMenu_ModuleOptions)] public string? ModuleOptions { get; set; }//動態參數，存Json格式

        #region 主子表關聯
        public SiteMenu_Item_DTO? _SiteMenu_Index { get; set; }
        #endregion
    }

    #region Request DTO
    public class SaveSiteInfo_DTO
    {
        public string InternalId { get; set; } = "";
        public SiteMenu_Index_DTO SiteMenu_Index { get; set; } = new();
        public List<SiteMenu_IndexInfo_DTO> SiteMenu_IndexInfo { get; set; } = [];
    }

    public class SaveMenuStructure_DTO
    {
        public string InternalId { get; set; } = "";
        public List<SaveMenuStructureItem_DTO> Items { get; set; } = [];
        public List<int> DeletedRowIds { get; set; } = [];
    }

    public class SaveMenuStructureItem_DTO
    {
        public int RowId { get; set; }
        public int? ParentRowId { get; set; }
        public byte DisplayOrder { get; set; }
    }

    public class SaveMenuItem_DTO
    {
        public string InternalId { get; set; } = "";
        public int? RowId { get; set; }
        public int? ParentRowId { get; set; }
        public byte DisplayOrder { get; set; }
        public string ItemSiteUrl { get; set; } = "";
        public MenuUrlType ItemType { get; set; }
        public WindowTarget WindowTarget { get; set; }
        public List<SaveMenuItemTitle_DTO> Titles { get; set; } = [];
        public SaveMenuItemUrl_DTO? Url { get; set; }
        public SaveMenuItemModule_DTO? Module { get; set; }
    }

    public class SaveMenuItemTitle_DTO
    {
        public int? RowId { get; set; }
        public LangCode? Lang { get; set; }
        public string? Title { get; set; }
        public bool IsShowOnMenu { get; set; }
    }

    public class SaveMenuItemUrl_DTO
    {
        public MenuUrlType RedirectType { get; set; }
        public string? RedirectUrl { get; set; }
    }

    public class SaveMenuItemModule_DTO
    {
        public string? BannerId { get; set; }
        public ModulePageType PageType { get; set; }
        public string? ModuleProgId { get; set; }
        public string? ModuleOptions { get; set; }
    }

    public class SaveMenuItemResult_DTO
    {
        public int RowId { get; set; }
        public string? FullUrl { get; set; }
        public bool IsNewItem { get; set; }
    }
    #endregion
}
