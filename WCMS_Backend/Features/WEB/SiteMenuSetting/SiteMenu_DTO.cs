using WCMS.Features.WEB.Content;
using WCMS.SysCore.I18n;

namespace WCMS.Features.WEB.SiteMenuSetting;

public class SaveSiteInfo_DTO
{
    public string InternalId { get; set; } = "";
    public SiteMenu_IndexModel SiteMenu_Index { get; set; } = new();
    public List<SiteMenu_IndexInfoModel> SiteMenu_IndexInfo { get; set; } = [];
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
