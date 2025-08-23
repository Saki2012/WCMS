using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Data;
using System.Text.RegularExpressions;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SpecFeatures.T1810.SystemSetting;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteMenuSetting
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SiteMenuController : ApiDataController<SiteMenuSet, SiteMenuSet_DTO>
    {
        private IBizService<PageManagementSet> _PageManagementService;
        private PageManagementBiz PageManagementService => (PageManagementBiz)(_PageManagementService ??= HttpContext.RequestServices.GetRequiredService<IBizService<PageManagementSet>>());

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct)
        {
            SiteMenuSet_DTO set = await ConvertToApiModel();
            return await InitialCreateData([set], ct);
        }
        private async Task<SiteMenuSet_DTO> ConvertToApiModel()
        {
            SiteMenuSet_DTO set = new();
            Dictionary<string, string> sqls = new()
            {
                { "SiteInfo", "Select * From SiteInfo" },
                { "SiteInfo_Lang", "Select * From SiteInfo_Lang" },
                { "Menu","Select * From Menu" },
                { "Menu_Lang","Select * From Menu_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            SetSiteIndex(set, ds.Tables["SiteInfo"], ds.Tables["SiteInfo_Lang"]);
            await SetSideMenu(set, ds.Tables["Menu"], ds.Tables["Menu_Lang"]);
            SetParentId(set.SiteMenu_Item, ds.Tables["Menu"]);
            SetFullUrl(set.SiteMenu_Item);
            return set;
        }
        private void SetSiteIndex(SiteMenuSet_DTO set, DataTable dsInfo, DataTable dsInfoLang)
        {
            set.SiteMenu_Index = new SiteMenu_Index_DTO();
            DataRow siteinfoRow = dsInfo.Select().FirstOrDefault();

            set.SiteMenu_Index.SiteIndex = siteinfoRow["SiteID"].ToString();

            set.SiteMenu_Index.GoogleAnalytics = siteinfoRow["GoogleAnalysis"].ToString();
            foreach(DataRow r in dsInfoLang.Rows) 
            {
                string lang = r["Lang"].ToString();
                var siteInfo = set.SiteMenu_IndexInfo.FirstOrDefault(p => p.Lang == lang);
                if (siteInfo == null)
                {
                    siteInfo = new SiteMenu_IndexInfo_DTO() { Lang = lang };
                    set.SiteMenu_IndexInfo.Add(siteInfo);
                }
                siteInfo.SiteIndex = set.SiteMenu_Index.SiteIndex;
                siteInfo.Title = r["SiteTitle"].ToString();
                siteInfo.SiteHeader = r["SiteHeader"].ToString();
                siteInfo.SiteFooter = r["SiteFooter"].ToString();
                siteInfo.Description = siteinfoRow["SiteDescription"].ToString();
                siteInfo.Keyword = siteinfoRow["SiteKeyword"].ToString();
            }
        }
        private async Task SetSideMenu(SiteMenuSet_DTO set, DataTable menu,DataTable menuLang)
        {
            int rowId = 1;
            foreach(DataRow r in menu.Select().Skip(1))
            {
                string sn = r["Sn"].ToString();
                if (r["Type"].ToString().In("url", "module"))
                {
                    var item = new SiteMenu_Item_DTO();
                    set.SiteMenu_Item.Add(item);
                    item.SiteIndex = set.SiteMenu_Index.SiteIndex;
                    item.RowId = rowId++;
                    item.ItemSiteUrl = r["Menu_ID"].ToString();

                    //item.ParentRowId=""☆重點處理完，Menu資料問題就解決了

                    string menuLv = r["MenuLevel"].ToString();
                    item.Level = menuLv.Split(',').Length.ToByte();
                    item.DisplayOrder = menuLv.Split(',').LastOrDefault().ToByte();

                    int titleRowId = 1;
                    foreach (DataRow rl in menuLang.Select($"Sn={sn}"))
                    {
                        item.WindowTarget = rl["URL_Open"].ToByte() == 1 ? WindowTarget.Self : WindowTarget.Blank;
                        item.IsShowOnMenu = Convert.ToBoolean(rl["MenuDisplay"]);
                        set.SiteMenu_Item_Title.Add(new SiteMenu_Item_Title_DTO()
                        {
                            SiteIndex = set.SiteMenu_Index.SiteIndex,
                            ItemRowId = item.RowId,
                            RowId = titleRowId++,
                            Lang = rl["Lang"].ToString(),
                            Title = rl["Title"].ToString()
                        });
                    }
                    switch (r["Type"].ToString())
                    {
                        case "url":
                            {
                                item.ItemType = MenuUrlType.Url;
                                var item_url = new SiteMenu_Item_Url_DTO()
                                {
                                    SiteIndex = set.SiteMenu_Index.SiteIndex,
                                    ItemRowId = item.RowId,
                                };
                                set.SiteMenu_Item_Url.Add(item_url);
                                foreach (DataRow rl in menuLang.Select($"Sn={sn}"))
                                {
                                    string url = rl["URL"].ToString();

                                    if (url.StartsWith("/Front"))
                                    {
                                        item_url.RedirectType = MenuUrlType.Module ;
                                        var noFront = Regex.Replace(url, @"^/Front(?=/)", string.Empty, RegexOptions.IgnoreCase);
                                        item_url.RedirectUrl = Regex.Replace(noFront, @"/[^/]*\.(?:aspx|html)(?:\?.*)?$", string.Empty, RegexOptions.IgnoreCase).TrimEnd('/');
                                    }
                                    else
                                    {
                                        item_url.RedirectType = MenuUrlType.Url;
                                        item_url.RedirectUrl = url;
                                    }
                                }
                                break;
                            }
                        case "module":
                            {
                                item.ItemType = MenuUrlType.Module;
                                set.SiteMenu_Item_Module.Add(new SiteMenu_Item_Module_DTO()
                                {
                                    SiteIndex = set.SiteMenu_Index.SiteIndex,
                                    ItemRowId = item.RowId,
                                    BannerId = r["Banner"].ToString(),
                                    ModuleProgId = SetProgId(r["ContentA_Module"].ToString()),
                                    ModuleOptions = await SetModuleOptions(r["ContentA_Module"].ToString(),r)
                                });
                                break;
                            }
                    }
                }
            }
        }
        private void SetParentId(List<SiteMenu_Item_DTO> srcItems, DataTable menu)
        {
            Dictionary<string, string> dic = [];
            foreach (DataRow r in menu.Rows) dic.Add(r["Menu_ID"].ToString(), r["MenuLevel"].ToString());

            foreach (var item in srcItems) 
            {
                string parent = null;
                var parts = dic[item.ItemSiteUrl].Split(',');
                if (parts.Length > 1) parent = string.Join(",", parts.Take(parts.Length - 1));
                if (parent.IsNullOrEmpty()) continue;
                item.ParentRowId = srcItems.Find(p => p.ItemSiteUrl ==  dic.FirstOrDefault(p=>p.Value==parent).Key).RowId;
            }

        }
        private void SetFullUrl(List<SiteMenu_Item_DTO> srcItems)
        {
            var items = srcItems.OrderBy(p => p.Level).ThenBy(p => p.DisplayOrder);
            foreach(var item in items)
            {
                if (item.ParentRowId == null)
                    item.FullUrl ="/" + LibData.Merge("/", false, item.SiteIndex, item.ItemSiteUrl);
                else
                {
                    string pFullUrl = items.FirstOrDefault(p => (p.SiteIndex == item.SiteIndex && p.RowId == item.ParentRowId)).FullUrl;
                    if (!pFullUrl.StartsWith('/')) pFullUrl = "/" + pFullUrl;
                    item.FullUrl = LibData.Merge("/", false, pFullUrl, item.ItemSiteUrl);
                }
            }
        }
        private static string SetProgId(string srcModule)
        {
            return srcModule switch
            {
                "page" => "PageManagement",
                "gallery" => "Gallery",
                "news" => "Announcement",
                "archive" => "FileArchive",
                "webresource" => "WebResource",
                "ResearchProject" => "SpecResearch",
                "USRProject" => "SpecUSR",
                _ => srcModule,
            };
        }
        private async Task<string> SetModuleOptions(string srcModule,DataRow r)
        {
            switch (srcModule)
            {
                case "page": 
                    {
                        string pageId = r["ContentA_Page"].ToString();
                        var data = await PageManagementService.BizQueryListAsync([nameof(PageManagement.InternalId)], $"{nameof(PageManagement.PageId)} = {pageId}", 0, 0);
                        var option = new ModuleOptions.PageManagement()
                        {
                            PageId = data.FirstOrDefault().PageManagement.InternalId
                        };
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                case "gallery":
                    {
                        var option = new ModuleOptions.Gallery()
                        {
                            Category = r["ContentA_Category"].ToString().Remerge(","),
                            Tag = r["ContentA_Tag"].ToString().Remerge(",")
                        };
                        switch (r["ContentA_Template"].ToString())
                        {
                            case "gallery_template1":
                                option.Style = ModuleDisplayStyle.List;
                                break;
                            case "gallery_template2":
                                option.Style = ModuleDisplayStyle.Waterfall;
                                break;
                        }
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                case "news":
                    {
                        var option = new ModuleOptions.Announcement()
                        {
                            Category = r["ContentA_Category"].ToString().Remerge(","),
                            Tag = r["ContentA_Tag"].ToString().Remerge(",")
                        };
                        switch (r["ContentA_Template"].ToString())
                        {
                            case "news_template1":
                                option.Style = ModuleDisplayStyle.List;
                                break;
                            case "news_template2":
                                option.Style = ModuleDisplayStyle.PictureList;
                                break;
                            case "news_template3":
                                option.Style = ModuleDisplayStyle.QAList;
                                break;
                        }
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                case "archive":
                    {
                        var option = new ModuleOptions.FileArchive()
                        {
                            Category = r["ContentA_Category"].ToString().Remerge(","),
                            Tag = r["ContentA_Tag"].ToString().Remerge(",")
                        };
                        switch (r["ContentA_Template"].ToString())
                        {
                            case "archive_template1":
                                option.Style = ModuleDisplayStyle.List;
                                break;
                            case "archive_template2":
                                option.Style = ModuleDisplayStyle.Expand_Category;
                                break;
                            case "archive_template3":
                                option.Style = ModuleDisplayStyle.Expand_Tag;
                                break;
                        }
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                case "webresource":
                    {
                        var option = new ModuleOptions.WebResource()
                        {
                            Category = r["ContentA_Category"].ToString().Remerge(","),
                            Tag = r["ContentA_Tag"].ToString().Remerge(",")
                        };
                        switch (r["ContentA_Template"].ToString())
                        {
                            case "webresource_template1":
                                option.Style = ModuleDisplayStyle.List;
                                break;
                            case "webresource_template2":
                                option.Style = ModuleDisplayStyle.PictureList;
                                break;
                            case "webresource_template3":
                                option.Style = ModuleDisplayStyle.Youtube;
                                break;
                        }
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                case "ResearchProject":
                    {
                        var option = new SpecModuleOptions.SpecResearchOptions()
                        {
                            Category = $"Res_{r["ContentA_Category"]}",
                            Tag = r["ContentA_Tag"].ToString().Remerge(",")
                        };
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                case "USRProject":
                    {
                        var option = new SpecModuleOptions.SpecResearchOptions()
                        {
                            Category = $"USR_{r["ContentA_Category"]}",
                            Tag = r["ContentA_Tag"].ToString().Remerge(",")
                        };
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                default: return srcModule;
            };
        }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenuSet_DTO
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
    public class SiteMenu_Index_DTO
    {
        /// <summary>
        /// 
        /// </summary>
        public string InternalId { get; set; }
        /// <summary>
        /// 首頁代碼
        /// </summary>
        public string? SiteIndex { get; set; }
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
        public int? RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        public string? Lang { get; set; }
        /// <summary>
        /// 網站標題
        /// </summary>
        public string Title { get; set; }
        /// <summary>
        /// 網站描述
        /// </summary>
        public string Description { get; set; }
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
        public string? ModuleProgId { get; set; } //功能代碼
        public string? ModuleOptions { get; set; }//動態參數，存Json格式
    }
}
