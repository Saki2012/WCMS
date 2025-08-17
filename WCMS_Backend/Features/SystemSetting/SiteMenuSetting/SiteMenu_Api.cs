using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Index.KdTree;
using Newtonsoft.Json;
using System;
using System.Data;
using System.Text.RegularExpressions;
using WCMS.Features.SiteEdit.Banner;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SpecFeatures.T1810.SystemSetting;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteMenuSetting
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SiteMenu_Api : ApiDataController<SiteMenuSet>
    {


        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct)
        {
            SiteMenuSet set = await ConvertToApiModel();
            return await InitialCreateData([set], ct);
        }
        private async Task<SiteMenuSet> ConvertToApiModel()
        {
            SiteMenuSet set = new();
            set.SiteMenu_Index.IsIniData = true;
            Dictionary<string, string> sqls = new()
            {
                { "SiteInfo", "Select * From SiteInfo" },
                { "SiteInfo_Lang", "Select * From SiteInfo_Lang" },
                { "Menu","Select * From Menu" },
                { "Menu_Lang","Select * From Menu_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            SetSiteIndex(set, ds.Tables["SiteInfo"], ds.Tables["SiteInfo_Lang"]);
            SetSideMenu(set, ds.Tables["Menu"], ds.Tables["Menu_Lang"]);
            SetParentId(set.SiteMenu_Item, ds.Tables["Menu"]);
            return set;
        }
        private void SetSiteIndex(SiteMenuSet set, DataTable dsInfo, DataTable dsInfoLang)
        {
            set.SiteMenu_Index = new SiteMenu_IndexModel();
            DataRow siteinfoRow = dsInfo.Select().FirstOrDefault();

            set.SiteMenu_Index.SiteIndex = siteinfoRow["SiteID"].ToString();

            set.SiteMenu_Index.GoogleAnalytics = siteinfoRow["GoogleAnalysis"].ToString();
            foreach(DataRow r in dsInfoLang.Rows) 
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
        private void SetSideMenu(SiteMenuSet set, DataTable menu,DataTable menuLang)
        {
            int rowId = 1;
            foreach(DataRow r in menu.Select().Skip(1))
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


                    foreach (DataRow rl in menuLang.Select($"Sn={sn}"))
                    {
                        item.WindowTarget = rl["URL_Open"].ToByte() == 1 ? WindowTarget.Self : WindowTarget.Blank;
                        item.IsShowOnMenu = Convert.ToBoolean(rl["MenuDisplay"]);
                        set.SiteMenu_Item_Title.Add(new SiteMenu_Item_Title()
                        {
                            SiteIndex = set.SiteMenu_Index.SiteIndex,
                            ItemRowId = item.RowId,
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
                                    RowId = item.RowId,
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
                                set.SiteMenu_Item_Module.Add(new SiteMenu_Item_Module()
                                {
                                    SiteIndex = set.SiteMenu_Index.SiteIndex,
                                    RowId = item.RowId,
                                    BannerId = r["Banner"].ToString(),
                                    ModuleProgId = SetProgId(r["ContentA_Module"].ToString()),
                                    ModuleOptions = SetModuleOptions(r["ContentA_Module"].ToString(),r)
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
                item.ParentRowId = srcItems.Find(p => p.ItemSiteUrl ==  dic.FirstOrDefault(p=>p.Value==parent).Key).RowId;
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
        private static string SetModuleOptions(string srcModule,DataRow r)
        {
            switch (srcModule)
            {
                case "page": 
                    {
                        var option = new ModuleOptions.PageManagement()
                        {
                            PageId = r["ContentA_Page"].ToString()
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
                        var option = new SpecModuleOptions.SpecResearch()
                        {
                            Category = r["ContentA_Category"].ToString(),
                            Tag = r["ContentA_Tag"].ToString().Remerge(",")
                        };
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                case "USRProject":
                    {
                        var option = new ModuleOptions.PageManagement()
                        {
                            PageId = r["ContentA_Page"].ToString()
                        };
                        return JsonConvert.SerializeObject(option, Formatting.None);
                    }
                default: return srcModule;
            };
        }
        #endregion
    }
}
