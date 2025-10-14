using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Data;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using WCMS.Features.SiteEdit.Banner;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SpecFeatures.T1810.SystemSetting;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting
{
    [ProgId("SiteMenu")]
    public class SiteMenuBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<SiteMenuSet>(repo, message), IBizService<SiteMenuSet>
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task Migrate(PageManagementBiz pageManagementService)
        {
            SiteMenuSet set = await ConvertToApiModel(pageManagementService);
            await BizInitCreateSetsAsync([set]);
        }
        private async Task<SiteMenuSet> ConvertToApiModel(PageManagementBiz pageManagementService)
        {
            SiteMenuSet set = new();
            Dictionary<string, string> sqls = new()
            {
                { "SiteInfo", "Select * From SiteInfo" },
                { "SiteInfo_Lang", "Select * From SiteInfo_Lang" },
                { "Menu","Select * From Menu" },
                { "Menu_Lang","Select * From Menu_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            SetSiteIndex(set, ds.Tables["SiteInfo"], ds.Tables["SiteInfo_Lang"]);
            await SetSideMenu(set, ds.Tables["Menu"], ds.Tables["Menu_Lang"], pageManagementService);
            SetParentId(set.SiteMenu_Item, ds.Tables["Menu"]);
            SetFullUrl(set.SiteMenu_Item);
            return set;
        }
        private void SetSiteIndex(SiteMenuSet set, DataTable dsInfo, DataTable dsInfoLang)
        {
            set.SiteMenu_Index = new SiteMenu_IndexModel();
            DataRow siteinfoRow = dsInfo.Select().FirstOrDefault();

            set.SiteMenu_Index.SiteIndex = siteinfoRow["SiteID"].ToString();

            set.SiteMenu_Index.GoogleAnalytics = siteinfoRow["GoogleAnalysis"].ToString();
            foreach (DataRow r in dsInfoLang.Rows)
            {
                string lang = r["Lang"].ToString();
                var siteInfo = set.SiteMenu_IndexInfo.FirstOrDefault(p => p.Lang == lang);
                if (siteInfo == null)
                {
                    siteInfo = new SiteMenu_IndexInfoModel() { Lang = lang };
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
        private async Task SetSideMenu(SiteMenuSet set, DataTable menu, DataTable menuLang, PageManagementBiz pageManagementService)
        {
            int rowId = 1;
            foreach (DataRow r in menu.Select().Skip(1))
            {
                string sn = r["Sn"].ToString();
                if (r["Type"].ToString().In("url", "module"))
                {
                    var item = new SiteMenu_Item();
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
                        set.SiteMenu_Item_Title.Add(new SiteMenu_Item_Title()
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
                                var item_url = new SiteMenu_Item_Url()
                                {
                                    SiteIndex = set.SiteMenu_Index.SiteIndex,
                                    ItemRowId = item.RowId,
                                };
                                set.SiteMenu_Item_Url.Add(item_url);
                                foreach (DataRow rl in menuLang.Select($"Sn={sn}"))
                                {
                                    string url = rl["Url"].ToString();

                                    if (url.StartsWith("/Front"))
                                    {
                                        item_url.RedirectType = MenuUrlType.Module;
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
                                set.SiteMenu_Item_Module.Add(new SiteMenu_Item_Module()
                                {
                                    SiteIndex = set.SiteMenu_Index.SiteIndex,
                                    ItemRowId = item.RowId,
                                    BannerId = r["Banner"].ToString(),
                                    ModuleProgId = SetProgId(r["ContentA_Module"].ToString()),
                                    ModuleOptions = await SetModuleOptions(r["ContentA_Module"].ToString(), r, pageManagementService)
                                });
                                break;
                            }
                    }
                }
            }
        }
        private void SetParentId(List<SiteMenu_Item> srcItems, DataTable menu)
        {
            Dictionary<string, string> dic = [];
            foreach (DataRow r in menu.Rows) dic.Add(r["Menu_ID"].ToString(), r["MenuLevel"].ToString());

            foreach (var item in srcItems)
            {
                string parent = null;
                var parts = dic[item.ItemSiteUrl].Split(',');
                if (parts.Length > 1) parent = string.Join(",", parts.Take(parts.Length - 1));
                if (parent.IsNullOrEmpty()) continue;
                item.ParentRowId = srcItems.Find(p => p.ItemSiteUrl == dic.FirstOrDefault(p => p.Value == parent).Key).RowId;
            }

        }
        private void SetFullUrl(List<SiteMenu_Item> srcItems)
        {
            var items = srcItems.OrderBy(p => p.Level).ThenBy(p => p.DisplayOrder);
            foreach (var item in items)
            {
                if (item.ParentRowId == null)
                    item.FullUrl = "/" + LibData.Merge("/", false, item.SiteIndex, item.ItemSiteUrl);
                else
                {
                    string pFullUrl = items.FirstOrDefault(p => p.SiteIndex == item.SiteIndex && p.RowId == item.ParentRowId).FullUrl;
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
        private async Task<string> SetModuleOptions(string srcModule, DataRow r, PageManagementBiz pageManagementService)
        {
            switch (srcModule)
            {
                case "page":
                    {
                        string pageId = r["ContentA_Page"].ToString();
                        var data = await pageManagementService.BizQueryListAsync([nameof(PageManagement.InternalId)], $"{nameof(PageManagement.PageId)} = {pageId}", default, 0, 0);
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
            }
            ;
        }
        #endregion

        #region Property
        protected override bool IsAutoGenerateId { get; set; } = false;
        #endregion

        #region Protected
        protected override async Task BeforeUpdate(SiteMenuSet set, FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    CheckData(set);
                    if (Message.HasError) return;
                    SetData(set);
                    break;
            }
        }
        #endregion

        #region Private
        private void CheckData(SiteMenuSet set)
        {
            CheckSiteUrlHasEmpty(set);
        }

        private void CheckSiteUrlHasEmpty(SiteMenuSet set)
        {
            Regex menuIdRegex = new Regex(@"^[A-Za-z0-9_-]+$", RegexOptions.Compiled);
            foreach (var dt in set.SiteMenu_Item)
            {
                dt.ItemSiteUrl = dt.ItemSiteUrl.Trim();//防呆，清空前後空白
                if (dt.ItemSiteUrl.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<SiteMenu_Item>(x => x.ItemSiteUrl));
                if(!menuIdRegex.IsMatch(dt.ItemSiteUrl)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00016, string.Format("{0}:{1}",I18nCache.GetLabel<SiteMenu_Item>(x => x.ItemSiteUrl),dt.ItemSiteUrl));
            }
            foreach(var dt in set.SiteMenu_Item_Title)
            {   
                //暫時寫死zh-tw跟繁體中文
                if (dt.Lang.Equals("zh-tw")&&dt.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, "繁體中文", I18nCache.GetLabel<SiteMenu_Item_Title>(x => x.Title));
            }
        }
        private static void SetData(SiteMenuSet set)
        {
            SetItemFullUrl(set);
        }
        private static void SetItemFullUrl(SiteMenuSet set)
        {
            if (set?.SiteMenu_Item == null || set.SiteMenu_Item.Count == 0) return;
            var byId = set.SiteMenu_Item.ToDictionary(x => x.RowId);
            static string Normalize(string? segment) => (segment ?? string.Empty).Trim('/');
            static string Combine(string? parentFull, string segment)
            {
                var p = (parentFull ?? string.Empty).Trim('/');
                var s = Normalize(segment);
                return "/" + (string.IsNullOrEmpty(p) ? s : $"{p}/{s}");
            }
            foreach (var item in set.SiteMenu_Item.OrderBy(i => i.Level))
            {
                var seg = Normalize(item.ItemSiteUrl);
                if (item.ParentRowId is null || !byId.TryGetValue(item.ParentRowId.Value, out var parent))
                {
                    item.FullUrl = "/" + seg;
                    continue;
                }
                item.FullUrl = Combine(parent.FullUrl, seg);
            }
        }
        #endregion
    }
}
