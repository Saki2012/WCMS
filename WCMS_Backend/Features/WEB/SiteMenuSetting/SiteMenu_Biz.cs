using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Data;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.Features.WEB.PageManagement;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.SiteMenuSetting
{
    [LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.SiteMenu)]
    public class SiteMenuBiz(BizDeps bizDeps) : BizService<SiteMenuSet>(bizDeps), IBizService<SiteMenuSet>
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
                LangCodeExt.TryParse(r["Lang"].ToString(), out LangCode lang);
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
                        LangCodeExt.TryParse(rl["Lang"].ToString(), out LangCode lang);
                        set.SiteMenu_Item_Title.Add(new SiteMenu_Item_Title()
                        {
                            SiteIndex = set.SiteMenu_Index.SiteIndex,
                            ItemRowId = item.RowId,
                            RowId = titleRowId++,
                            Lang = lang,
                            Title = rl["Title"].ToString(),
                            IsShowOnMenu = Convert.ToBoolean(rl["MenuDisplay"]),
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
                        var data = await pageManagementService.BizQueryListAsync([nameof(PageManagement.PageManagement.InternalId)], $"{nameof(PageManagement.PageManagement.PageId)} = {pageId}", default, default,0, 0);
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
                
                default: return srcModule;
            }
            ;
        }
        #endregion

        #region Property
        protected override bool IsAutoGenerateId { get; set; } = false;
        #endregion

        #region Public
        /// <summary>
        /// 保存更新網站基本資訊
        /// </summary>
        public async Task SaveSiteInfoAsync(string internalId, string? googleAnalytics, bool enable, LangCode? defaultLang, string? supportLangs, List<SiteMenu_IndexInfoModel> infos, CancellationToken ct = default)
        {
            await ExecTransactionAsync<object>(
                async _ =>
                {
                    var oldIndex = await QuerySiteMenuIndexAsync(internalId, ct);
                    if (oldIndex == null) return null;
                    var newIndex = oldIndex.Snapshot();
                    ApplySiteInfoIndex(newIndex, googleAnalytics, enable, defaultLang, supportLangs);
                    await UpdateModelAsync(oldIndex, newIndex, ct);
                    await SaveSiteMenuIndexInfoAsync(oldIndex.SiteIndex, infos, ct);
                    return null;
                },
                async (_, _) =>
                {
                    AddSuccessMessage();
                    await Task.CompletedTask;
                },
                ct);
        }

        /// <summary>
        /// 保存更新網站選單結構與階層關係
        /// </summary>
        public async Task<SaveMenuStructure_DTO> SaveMenuStructureAsync(SaveMenuStructure_DTO request, CancellationToken ct = default)
        {
            await ExecTransactionAsync<object>(
                async _ =>
                {
                    var oldIndex = await QuerySiteMenuIndexAsync(request.InternalId, ct);
                    if (oldIndex == null) return null;

                    var oldItems = await QuerySiteMenuItemsAsync(oldIndex.SiteIndex, ct);
                    var oldTitles = await QuerySiteMenuItemTitlesAsync(oldIndex.SiteIndex, null, ct);
                    var deleteIds = ResolveDeleteRowIds(oldItems, request.DeletedRowIds);
                    var newItems = BuildMenuStructureSnapshot(oldItems, request.Items, deleteIds);
                    var newTitles = oldTitles.Where(x => !deleteIds.Contains(x.ItemRowId)).ToList();

                    CheckMenuStructure(newItems);
                    if (Message.HasError) return null;

                    ApplyUpdateRules(BuildMenuCheckSet(newItems, newTitles));
                    if (Message.HasError) return null;

                    await UpdateChangedMenuItemsAsync(oldItems, newItems, ct);
                    await DeleteMenuItemsAsync(oldIndex.SiteIndex, deleteIds, ct);
                    await TouchSiteMenuIndexAsync(oldIndex, ct);
                    return null;
                },
                async (_, _) =>
                {
                    AddSuccessMessage();
                    await Task.CompletedTask;
                },
                ct);

            return request;
        }

        /// <summary>
        /// 保存更新網站選單項目內容與設定
        /// </summary>
        public async Task<SaveMenuItemResult_DTO> SaveMenuItemAsync(SaveMenuItem_DTO request, CancellationToken ct = default)
        {
            var result = new SaveMenuItemResult_DTO();

            await ExecTransactionAsync<object>(
                async _ =>
                {
                    var oldIndex = await QuerySiteMenuIndexAsync(request.InternalId, ct);
                    if (oldIndex == null) return null;

                    var isNewItem = request.RowId == null || request.RowId <= 0;

                    if (isNewItem) result = await SaveNewMenuItemAsync(oldIndex, request, ct);
                    else result = await SaveExistingMenuItemAsync(oldIndex, request, ct);

                    await TouchSiteMenuIndexAsync(oldIndex, ct);
                    return null;
                },
                async (_, _) =>
                {
                    AddSuccessMessage();
                    await Task.CompletedTask;
                },
                ct);

            return result;
        }
        #endregion

        #region Protected Virtual
        protected override async Task BeforeUpdate(SiteMenuSet set, FuncAction act, CancellationToken ct = default)
        {
            await base.BeforeUpdate(set, act, ct);

            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    ApplyUpdateRules(set);
                    break;
            }
        }
        #endregion

        #region Protected
        /// <summary>
        /// 套用完整更新與個別更新共用的檢查與賦值規則
        /// </summary>
        protected void ApplyUpdateRules(SiteMenuSet set)
        {
            CheckBasicRules(set);
            if (Message.HasError) return;

            SetData(set);
            if (Message.HasError) return;

            CheckComputedRules(set);
        }

        /// <summary>
        /// 設定選單衍生資料
        /// </summary>
        protected void SetData(SiteMenuSet set)
        {
            SetItemFullUrl(set);
        }
        #endregion

        #region Private
        /// <summary>
        /// 加入保存成功訊息
        /// </summary>
        private void AddSuccessMessage()
        {
            if (!Message.HasError) Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00006);
        }

        /// <summary>
        /// 查詢站台主資料
        /// </summary>
        private async Task<SiteMenu_IndexModel?> QuerySiteMenuIndexAsync(string internalId, CancellationToken ct = default)
        {
            var data = await DoQueryListAsync<SiteMenu_IndexModel>([], $"{nameof(HeaderModel.InternalId)} = '{SqlValue(internalId)}'", default, 0, 1);
            return data.Cast<SiteMenu_IndexModel>().FirstOrDefault();
        }

        /// <summary>
        /// 查詢站台所有選單項目
        /// </summary>
        private async Task<List<SiteMenu_Item>> QuerySiteMenuItemsAsync(string siteIndex, CancellationToken ct = default)
        {
            var data = await DoQueryListAsync<SiteMenu_Item>([], $"{nameof(SiteMenu_Item.SiteIndex)} = '{SqlValue(siteIndex)}'", default, 0, 0);
            return data.Cast<SiteMenu_Item>().ToList();
        }

        /// <summary>
        /// 查詢單筆選單項目
        /// </summary>
        private async Task<SiteMenu_Item?> QuerySiteMenuItemAsync(string siteIndex, int rowId, CancellationToken ct = default)
        {
            var data = await DoQueryListAsync<SiteMenu_Item>([], $"{nameof(SiteMenu_Item.SiteIndex)} = '{SqlValue(siteIndex)}' AND {nameof(SiteMenu_Item.RowId)} = {rowId}", default, 0, 1);
            return data.Cast<SiteMenu_Item>().FirstOrDefault();
        }

        /// <summary>
        /// 查詢站台選單標題
        /// </summary>
        private async Task<List<SiteMenu_Item_Title>> QuerySiteMenuItemTitlesAsync(string siteIndex, int? itemRowId = null, CancellationToken ct = default)
        {
            var where = $"{nameof(SiteMenu_Item_Title.SiteIndex)} = '{SqlValue(siteIndex)}'";
            if (itemRowId != null) where += $" AND {nameof(SiteMenu_Item_Title.ItemRowId)} = {itemRowId.Value}";

            var data = await DoQueryListAsync<SiteMenu_Item_Title>([], where, default, 0, 0);
            return data.Cast<SiteMenu_Item_Title>().ToList();
        }

        /// <summary>
        /// 查詢站台選單網址設定
        /// </summary>
        private async Task<List<SiteMenu_Item_Url>> QuerySiteMenuItemUrlsAsync(string siteIndex, int? itemRowId = null, CancellationToken ct = default)
        {
            var where = $"{nameof(SiteMenu_Item_Url.SiteIndex)} = '{SqlValue(siteIndex)}'";
            if (itemRowId != null) where += $" AND {nameof(SiteMenu_Item_Url.ItemRowId)} = {itemRowId.Value}";

            var data = await DoQueryListAsync<SiteMenu_Item_Url>([], where, default, 0, 0);
            return data.Cast<SiteMenu_Item_Url>().ToList();
        }

        /// <summary>
        /// 查詢站台選單模組設定
        /// </summary>
        private async Task<List<SiteMenu_Item_Module>> QuerySiteMenuItemModulesAsync(string siteIndex, int? itemRowId = null, CancellationToken ct = default)
        {
            var where = $"{nameof(SiteMenu_Item_Module.SiteIndex)} = '{SqlValue(siteIndex)}'";
            if (itemRowId != null) where += $" AND {nameof(SiteMenu_Item_Module.ItemRowId)} = {itemRowId.Value}";

            var data = await DoQueryListAsync<SiteMenu_Item_Module>([], where, default, 0, 0);
            return data.Cast<SiteMenu_Item_Module>().ToList();
        }

        /// <summary>
        /// 保存新增選單項目
        /// </summary>
        private async Task<SaveMenuItemResult_DTO> SaveNewMenuItemAsync(SiteMenu_IndexModel oldIndex, SaveMenuItem_DTO request, CancellationToken ct = default)
        {
            var oldItems = await QuerySiteMenuItemsAsync(oldIndex.SiteIndex, ct);
            var oldTitles = await QuerySiteMenuItemTitlesAsync(oldIndex.SiteIndex, null, ct);
            var savedRowId = ResolveSaveMenuItemRowId(oldItems, request);
            var newItem = BuildMenuItem(oldIndex.SiteIndex, savedRowId, request, null);
            var newItems = oldItems.Select(x => x.Snapshot()).Append(newItem).ToList();
            var newTitles = oldTitles.Select(x => x.Snapshot()).ToList();

            newTitles.AddRange(BuildMenuItemTitles(oldIndex.SiteIndex, savedRowId, request));

            CheckMenuStructure(newItems);
            if (Message.HasError) return new SaveMenuItemResult_DTO();
            NormalizeNewMenuItemOrder(newItems, savedRowId);
            ApplyUpdateRules(BuildMenuCheckSet(newItems, newTitles));
            if (Message.HasError) return new SaveMenuItemResult_DTO();

            var finalItem = newItems.First(x => x.RowId == savedRowId);

            await UpdateChangedMenuItemsAsync(oldItems, newItems, ct);
            await CreateModelAsync(finalItem, ct);
            await SaveMenuItemTitlesAsync(oldIndex.SiteIndex, savedRowId, BuildMenuItemTitles(oldIndex.SiteIndex, savedRowId, request), ct);
            await SaveMenuItemUrlAsync(oldIndex.SiteIndex, savedRowId, BuildMenuItemUrl(oldIndex.SiteIndex, savedRowId, request.Url), ct);
            await SaveMenuItemModuleAsync(oldIndex.SiteIndex, savedRowId, BuildMenuItemModule(oldIndex.SiteIndex, savedRowId, request.Module), ct);

            return new SaveMenuItemResult_DTO() { RowId = savedRowId, FullUrl = finalItem.FullUrl, IsNewItem = true };
        }

        /// <summary>
        /// 保存既有選單項目
        /// </summary>
        private async Task<SaveMenuItemResult_DTO> SaveExistingMenuItemAsync(SiteMenu_IndexModel oldIndex, SaveMenuItem_DTO request, CancellationToken ct = default)
        {
            var oldItem = await QuerySiteMenuItemAsync(oldIndex.SiteIndex, request.RowId!.Value, ct);
            if (oldItem == null) return new SaveMenuItemResult_DTO();

            var itemSiteUrlChanged = IsItemSiteUrlChanged(oldItem, request);

            if (itemSiteUrlChanged) return await SaveExistingMenuItemWithUrlChangedAsync(oldIndex, oldItem, request, ct);

            return await SaveExistingMenuItemWithoutStructureAsync(oldIndex, oldItem, request, ct);
        }

        /// <summary>
        /// 保存既有選單項目，不重算結構
        /// </summary>
        private async Task<SaveMenuItemResult_DTO> SaveExistingMenuItemWithoutStructureAsync(SiteMenu_IndexModel oldIndex, SiteMenu_Item oldItem, SaveMenuItem_DTO request, CancellationToken ct = default)
        {
            var newItem = oldItem.Snapshot();
            ApplyMenuItemContent(newItem, request);

            var titles = BuildMenuItemTitles(oldIndex.SiteIndex, oldItem.RowId, request);
            CheckSingleItemRules(newItem, titles);
            if (Message.HasError) return new SaveMenuItemResult_DTO();

            if (IsMenuContentChanged(oldItem, newItem)) await UpdateModelAsync(oldItem, newItem, ct);

            await SaveMenuItemTitlesAsync(oldIndex.SiteIndex, oldItem.RowId, titles, ct);
            await SaveMenuItemUrlAsync(oldIndex.SiteIndex, oldItem.RowId, BuildMenuItemUrl(oldIndex.SiteIndex, oldItem.RowId, request.Url), ct);
            await SaveMenuItemModuleAsync(oldIndex.SiteIndex, oldItem.RowId, BuildMenuItemModule(oldIndex.SiteIndex, oldItem.RowId, request.Module), ct);

            return new SaveMenuItemResult_DTO() { RowId = oldItem.RowId, FullUrl = oldItem.FullUrl, IsNewItem = false };
        }

        /// <summary>
        /// 保存既有選單項目，重算自身與子層完整網址
        /// </summary>
        private async Task<SaveMenuItemResult_DTO> SaveExistingMenuItemWithUrlChangedAsync(SiteMenu_IndexModel oldIndex, SiteMenu_Item oldItem, SaveMenuItem_DTO request, CancellationToken ct = default)
        {
            var oldItems = await QuerySiteMenuItemsAsync(oldIndex.SiteIndex, ct);
            var oldTitles = await QuerySiteMenuItemTitlesAsync(oldIndex.SiteIndex, null, ct);
            var newItems = oldItems.Select(x => x.Snapshot()).ToList();
            var target = newItems.FirstOrDefault(x => x.RowId == oldItem.RowId);

            if (target == null) return new SaveMenuItemResult_DTO();

            ApplyMenuItemContent(target, request);
            var newTitles = oldTitles.Where(x => x.ItemRowId != oldItem.RowId).Select(x => x.Snapshot()).ToList();
            newTitles.AddRange(BuildMenuItemTitles(oldIndex.SiteIndex, oldItem.RowId, request));

            ApplyUpdateRules(BuildMenuCheckSet(newItems, newTitles));
            if (Message.HasError) return new SaveMenuItemResult_DTO();

            await UpdateChangedMenuItemsAsync(oldItems, newItems, ct);
            await SaveMenuItemTitlesAsync(oldIndex.SiteIndex, oldItem.RowId, BuildMenuItemTitles(oldIndex.SiteIndex, oldItem.RowId, request), ct);
            await SaveMenuItemUrlAsync(oldIndex.SiteIndex, oldItem.RowId, BuildMenuItemUrl(oldIndex.SiteIndex, oldItem.RowId, request.Url), ct);
            await SaveMenuItemModuleAsync(oldIndex.SiteIndex, oldItem.RowId, BuildMenuItemModule(oldIndex.SiteIndex, oldItem.RowId, request.Module), ct);

            var finalItem = newItems.First(x => x.RowId == oldItem.RowId);
            return new SaveMenuItemResult_DTO() { RowId = oldItem.RowId, FullUrl = finalItem.FullUrl, IsNewItem = false };
        }

        /// <summary>
        /// 套用站台主表欄位
        /// </summary>
        private void ApplySiteInfoIndex(SiteMenu_IndexModel target, string? googleAnalytics, bool enable, LangCode? defaultLang, string? supportLangs)
        {
            target.GoogleAnalytics = googleAnalytics ?? "";
            target.Enable = enable;
            if (defaultLang != null) target.DefaultLang = defaultLang.Value;
            target.SupportLangs = supportLangs ?? "";
            SetModifyInfo(target);
        }

        /// <summary>
        /// 更新 SiteMenu_IndexInfo 多語系資料
        /// </summary>
        private async Task SaveSiteMenuIndexInfoAsync(string siteIndex, List<SiteMenu_IndexInfoModel> infos, CancellationToken ct = default)
        {
            var oldInfos = await QuerySiteMenuIndexInfosAsync(siteIndex, ct);
            foreach (var source in infos ?? []) await UpsertSiteMenuIndexInfoAsync(siteIndex, oldInfos, source, ct);
        }

        /// <summary>
        /// 查詢站台多語系資料
        /// </summary>
        private async Task<List<SiteMenu_IndexInfoModel>> QuerySiteMenuIndexInfosAsync(string siteIndex, CancellationToken ct = default)
        {
            var data = await DoQueryListAsync<SiteMenu_IndexInfoModel>([], $"{nameof(SiteMenu_IndexInfoModel.SiteIndex)} = '{SqlValue(siteIndex)}'", default, 0, 0);
            return data.Cast<SiteMenu_IndexInfoModel>().ToList();
        }

        /// <summary>
        /// 新增或更新單筆站台多語系資料
        /// </summary>
        private async Task UpsertSiteMenuIndexInfoAsync(string siteIndex, List<SiteMenu_IndexInfoModel> oldInfos, SiteMenu_IndexInfoModel source, CancellationToken ct = default)
        {
            source.SiteIndex = siteIndex;

            var oldInfo = oldInfos.FirstOrDefault(x => x.Lang == source.Lang);
            if (oldInfo == null)
            {
                source.RowId = ResolveNextIndexInfoRowId(oldInfos);
                await CreateModelAsync(source, ct);
                return;
            }

            var newInfo = oldInfo.Snapshot();
            ApplySiteMenuIndexInfo(newInfo, source);
            await UpdateModelAsync(oldInfo, newInfo, ct);
        }

        /// <summary>
        /// 取得站台多語下一個 RowId
        /// </summary>
        private int ResolveNextIndexInfoRowId(List<SiteMenu_IndexInfoModel> oldInfos)
        {
            return oldInfos.Count == 0 ? 1 : oldInfos.Max(x => x.RowId ?? 0) + 1;
        }

        /// <summary>
        /// 套用站台多語系欄位
        /// </summary>
        private void ApplySiteMenuIndexInfo(SiteMenu_IndexInfoModel target, SiteMenu_IndexInfoModel source)
        {
            target.Title = source.Title;
            target.SiteHeader = source.SiteHeader;
            target.SiteFooter = source.SiteFooter;
            target.Description = source.Description;
            target.Keyword = source.Keyword;
            target.BannerId = source.BannerId;
        }

        /// <summary>
        /// 建立選單檢查用 Set
        /// </summary>
        private SiteMenuSet BuildMenuCheckSet(List<SiteMenu_Item> items, List<SiteMenu_Item_Title> titles)
        {
            return new SiteMenuSet() { SiteMenu_Item = items, SiteMenu_Item_Title = titles };
        }

        /// <summary>
        /// 建立選單結構快照
        /// </summary>
        private List<SiteMenu_Item> BuildMenuStructureSnapshot(List<SiteMenu_Item> oldItems, List<SaveMenuStructureItem_DTO> items, HashSet<int> deleteIds)
        {
            var map = items.ToDictionary(x => x.RowId);
            var newItems = oldItems.Where(x => !deleteIds.Contains(x.RowId)).Select(x => x.Snapshot()).ToList();

            foreach (var item in newItems)
            {
                if (!map.TryGetValue(item.RowId, out var source)) continue;
                item.ParentRowId = source.ParentRowId;
                item.DisplayOrder = source.DisplayOrder;
            }

            return newItems;
        }

        /// <summary>
        /// 建立選單主表資料
        /// </summary>
        private SiteMenu_Item BuildMenuItem(string siteIndex, int rowId, SaveMenuItem_DTO request, SiteMenu_Item? oldItem)
        {
            var item = oldItem?.Snapshot() ?? new SiteMenu_Item() { SiteIndex = siteIndex, RowId = rowId };

            if (oldItem == null)
            {
                item.ParentRowId = request.ParentRowId;
                item.DisplayOrder = request.DisplayOrder;
            }

            ApplyMenuItemContent(item, request);
            return item;
        }

        /// <summary>
        /// 套用右側可編輯欄位
        /// </summary>
        private void ApplyMenuItemContent(SiteMenu_Item target, SaveMenuItem_DTO source)
        {
            target.ItemSiteUrl = source.ItemSiteUrl;
            target.ItemType = source.ItemType;
            target.WindowTarget = source.WindowTarget;
        }

        /// <summary>
        /// 判斷網址代碼是否異動
        /// </summary>
        private bool IsItemSiteUrlChanged(SiteMenu_Item oldItem, SaveMenuItem_DTO request)
        {
            return !string.Equals((oldItem.ItemSiteUrl ?? "").Trim(), (request.ItemSiteUrl ?? "").Trim(), StringComparison.Ordinal);
        }

        /// <summary>
        /// 解析要刪除的選單與其子層
        /// </summary>
        private HashSet<int> ResolveDeleteRowIds(List<SiteMenu_Item> oldItems, List<int> deletedRowIds)
        {
            HashSet<int> result = [];
            foreach (var rowId in deletedRowIds ?? []) CollectDeleteRowIds(oldItems, rowId, result);
            return result;
        }

        /// <summary>
        /// 收集刪除選單的所有子層
        /// </summary>
        private void CollectDeleteRowIds(List<SiteMenu_Item> items, int rowId, HashSet<int> result)
        {
            if (!result.Add(rowId)) return;

            foreach (var child in items.Where(x => x.ParentRowId == rowId))
                CollectDeleteRowIds(items, child.RowId, result);
        }

        /// <summary>
        /// 檢查選單結構是否合法
        /// </summary>
        private void CheckMenuStructure(List<SiteMenu_Item> items)
        {
            CheckMenuParentExists(items);
            CheckMenuCircularReference(items);
        }

        /// <summary>
        /// 檢查父層是否存在
        /// </summary>
        private void CheckMenuParentExists(List<SiteMenu_Item> items)
        {
            var ids = items.Select(x => x.RowId).ToHashSet();

            foreach (var item in items)
                if (item.ParentRowId != null && !ids.Contains(item.ParentRowId.Value))
                    Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00001);
        }

        /// <summary>
        /// 檢查是否有循環父子層
        /// </summary>
        private void CheckMenuCircularReference(List<SiteMenu_Item> items)
        {
            foreach (var item in items)
                if (HasCircularParent(items, item))
                    Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00001);
        }

        /// <summary>
        /// 判斷單筆選單是否發生循環父層
        /// </summary>
        private bool HasCircularParent(List<SiteMenu_Item> items, SiteMenu_Item item)
        {
            HashSet<int> visited = [];
            int? parentId = item.ParentRowId;

            while (parentId != null)
            {
                if (!visited.Add(parentId.Value)) return true;
                if (parentId == item.RowId) return true;
                parentId = items.FirstOrDefault(x => x.RowId == parentId.Value)?.ParentRowId;
            }

            return false;
        }

        /// <summary>
        /// 檢查基本欄位
        /// </summary>
        private void CheckBasicRules(SiteMenuSet set)
        {
            foreach (var item in set.SiteMenu_Item) CheckMenuItemBasicRules(item);
            foreach (var title in set.SiteMenu_Item_Title) CheckMenuTitleRules(title);
        }

        /// <summary>
        /// 檢查單筆 item 與 title
        /// </summary>
        private void CheckSingleItemRules(SiteMenu_Item item, List<SiteMenu_Item_Title> titles)
        {
            CheckMenuItemBasicRules(item);
            foreach (var title in titles) CheckMenuTitleRules(title);
        }

        /// <summary>
        /// 檢查選單網址基本規則
        /// </summary>
        private void CheckMenuItemBasicRules(SiteMenu_Item item)
        {
            Regex menuIdRegex = new Regex(@"^[A-Za-z0-9_-]+$", RegexOptions.Compiled);
            item.ItemSiteUrl = item.ItemSiteUrl?.Trim();

            if (item.ItemSiteUrl.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<SiteMenu_Item_DTO>(x => x.ItemSiteUrl));
            else if (!menuIdRegex.IsMatch(item.ItemSiteUrl)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00016, $"{I18nCache.GetLabel<SiteMenu_Item_DTO>(x => x.ItemSiteUrl)}:{item.ItemSiteUrl}");
        }

        /// <summary>
        /// 檢查選單標題基本規則
        /// </summary>
        private void CheckMenuTitleRules(SiteMenu_Item_Title title)
        {
            if (title.IsShowOnMenu && title.Title.IsNullOrEmpty())
                Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, title.Lang.ToLabel(), I18nCache.GetLabel<SiteMenu_Item_Title_DTO>(x => x.Title));
        }

        /// <summary>
        /// 檢查衍生欄位規則
        /// </summary>
        private void CheckComputedRules(SiteMenuSet set)
        {
            CheckReservedFullUrl(set);
            CheckFullUrlDuplicate(set);
        }

        /// <summary>
        /// 檢查保留網址
        /// </summary>
        private void CheckReservedFullUrl(SiteMenuSet set)
        {
            foreach (var item in set.SiteMenu_Item)
            {
                var url = (item.FullUrl ?? string.Empty).Trim('/').ToLowerInvariant();
                if (url == "service" || url.StartsWith("service/") || url == "server" || url.StartsWith("server/"))
                    Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00030);
            }
        }

        /// <summary>
        /// 重算選單完整網址
        /// </summary>
        private void SetItemFullUrl(SiteMenuSet set)
        {
            if (set?.SiteMenu_Item == null || set.SiteMenu_Item.Count == 0) return;

            ResetMenuLevel(set.SiteMenu_Item);
            ResetMenuFullUrl(set.SiteMenu_Item);
        }

        /// <summary>
        /// 重算選單層級
        /// </summary>
        private void ResetMenuLevel(List<SiteMenu_Item> items)
        {
            foreach (var root in items.Where(x => x.ParentRowId == null).OrderBy(x => x.DisplayOrder))
                ResetMenuLevelChildren(items, root, 1);
        }

        /// <summary>
        /// 遞迴重算子層層級
        /// </summary>
        private void ResetMenuLevelChildren(List<SiteMenu_Item> items, SiteMenu_Item item, byte level)
        {
            item.Level = level;

            foreach (var child in items.Where(x => x.ParentRowId == item.RowId).OrderBy(x => x.DisplayOrder))
                ResetMenuLevelChildren(items, child, (byte)(level + 1));
        }

        /// <summary>
        /// 重算選單完整網址
        /// </summary>
        private void ResetMenuFullUrl(List<SiteMenu_Item> items)
        {
            foreach (var item in items.OrderBy(x => x.Level).ThenBy(x => x.DisplayOrder))
                item.FullUrl = BuildMenuFullUrl(items, item);
        }

        /// <summary>
        /// 組合單筆選單完整網址
        /// </summary>
        private string BuildMenuFullUrl(List<SiteMenu_Item> items, SiteMenu_Item item)
        {
            var seg = (item.ItemSiteUrl ?? string.Empty).Trim('/');
            if (item.ParentRowId == null) return "/" + seg;

            var parent = items.FirstOrDefault(x => x.RowId == item.ParentRowId.Value);
            var parentUrl = (parent?.FullUrl ?? string.Empty).Trim('/');
            return "/" + LibData.Merge("/", false, parentUrl, seg);
        }

        /// <summary>
        /// 檢查 FullUrl 是否重複
        /// </summary>
        private void CheckFullUrlDuplicate(SiteMenuSet set)
        {
            HashSet<string> fullUrls = new(StringComparer.OrdinalIgnoreCase);

            foreach (var item in set.SiteMenu_Item.OrderBy(x => x.Level).ThenBy(x => x.DisplayOrder))
            {
                if (fullUrls.Add(item.FullUrl)) continue;

                var title = set.SiteMenu_Item_Title.FirstOrDefault(x => x.Lang == EffectiveLang && x.ItemRowId == item.RowId)?.Title ?? item.ItemSiteUrl;
                Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00026, title, item.ItemSiteUrl);
            }
        }

        /// <summary>
        /// 只更新有異動的選單資料
        /// </summary>
        private async Task UpdateChangedMenuItemsAsync(List<SiteMenu_Item> oldItems, List<SiteMenu_Item> newItems, CancellationToken ct = default)
        {
            var newMap = newItems.ToDictionary(x => x.RowId);

            foreach (var oldItem in oldItems)
            {
                if (!newMap.TryGetValue(oldItem.RowId, out var newItem)) continue;
                if (!IsMenuItemChanged(oldItem, newItem)) continue;
                await UpdateModelAsync(oldItem, newItem, ct);
            }
        }

        /// <summary>
        /// 判斷選單資料是否異動
        /// </summary>
        private bool IsMenuItemChanged(SiteMenu_Item oldItem, SiteMenu_Item newItem)
        {
            return oldItem.ParentRowId != newItem.ParentRowId
                || oldItem.Level != newItem.Level
                || oldItem.DisplayOrder != newItem.DisplayOrder
                || oldItem.FullUrl != newItem.FullUrl
                || oldItem.ItemSiteUrl != newItem.ItemSiteUrl
                || oldItem.ItemType != newItem.ItemType
                || oldItem.WindowTarget != newItem.WindowTarget;
        }

        /// <summary>
        /// 判斷右側內容是否異動
        /// </summary>
        private bool IsMenuContentChanged(SiteMenu_Item oldItem, SiteMenu_Item newItem)
        {
            return oldItem.ItemSiteUrl != newItem.ItemSiteUrl
                || oldItem.ItemType != newItem.ItemType
                || oldItem.WindowTarget != newItem.WindowTarget;
        }

        /// <summary>
        /// 儲存單筆選單標題
        /// </summary>
        private async Task SaveMenuItemTitlesAsync(string siteIndex, int itemRowId, List<SiteMenu_Item_Title> titles, CancellationToken ct = default)
        {
            var oldTitles = await QuerySiteMenuItemTitlesAsync(siteIndex, itemRowId, ct);

            foreach (var oldTitle in oldTitles) await DeleteModelAsync(oldTitle, ct);
            foreach (var title in titles ?? [])
            {
                title.SiteIndex = siteIndex;
                title.ItemRowId = itemRowId;
                await CreateModelAsync(title, ct);
            }
        }

        /// <summary>
        /// 儲存單筆選單網址設定
        /// </summary>
        private async Task SaveMenuItemUrlAsync(string siteIndex, int itemRowId, SiteMenu_Item_Url? url, CancellationToken ct = default)
        {
            var oldUrls = await QuerySiteMenuItemUrlsAsync(siteIndex, itemRowId, ct);

            foreach (var oldUrl in oldUrls) await DeleteModelAsync(oldUrl, ct);
            if (url == null) return;

            url.SiteIndex = siteIndex;
            url.ItemRowId = itemRowId;
            await CreateModelAsync(url, ct);
        }

        /// <summary>
        /// 儲存單筆選單模組設定
        /// </summary>
        private async Task SaveMenuItemModuleAsync(string siteIndex, int itemRowId, SiteMenu_Item_Module? module, CancellationToken ct = default)
        {
            var oldModules = await QuerySiteMenuItemModulesAsync(siteIndex, itemRowId, ct);

            foreach (var oldModule in oldModules) await DeleteModelAsync(oldModule, ct);
            if (module == null) return;

            module.SiteIndex = siteIndex;
            module.ItemRowId = itemRowId;
            await CreateModelAsync(module, ct);
        }

        /// <summary>
        /// 刪除選單與子表資料
        /// </summary>
        private async Task DeleteMenuItemsAsync(string siteIndex, HashSet<int> deleteIds, CancellationToken ct = default)
        {
            if (deleteIds.Count == 0) return;

            await DeleteMenuItemTitlesAsync(siteIndex, deleteIds, ct);
            await DeleteMenuItemUrlsAsync(siteIndex, deleteIds, ct);
            await DeleteMenuItemModulesAsync(siteIndex, deleteIds, ct);
            await DeleteMenuItemRowsAsync(siteIndex, deleteIds, ct);
        }

        /// <summary>
        /// 刪除選單標題資料
        /// </summary>
        private async Task DeleteMenuItemTitlesAsync(string siteIndex, HashSet<int> deleteIds, CancellationToken ct = default)
        {
            var rows = await QueryRowsByItemRowIdsAsync<SiteMenu_Item_Title>(siteIndex, nameof(SiteMenu_Item_Title.ItemRowId), deleteIds, ct);
            foreach (var row in rows) await DeleteModelAsync(row, ct);
        }

        /// <summary>
        /// 刪除選單網址資料
        /// </summary>
        private async Task DeleteMenuItemUrlsAsync(string siteIndex, HashSet<int> deleteIds, CancellationToken ct = default)
        {
            var rows = await QueryRowsByItemRowIdsAsync<SiteMenu_Item_Url>(siteIndex, nameof(SiteMenu_Item_Url.ItemRowId), deleteIds, ct);
            foreach (var row in rows) await DeleteModelAsync(row, ct);
        }

        /// <summary>
        /// 刪除選單模組資料
        /// </summary>
        private async Task DeleteMenuItemModulesAsync(string siteIndex, HashSet<int> deleteIds, CancellationToken ct = default)
        {
            var rows = await QueryRowsByItemRowIdsAsync<SiteMenu_Item_Module>(siteIndex, nameof(SiteMenu_Item_Module.ItemRowId), deleteIds, ct);
            foreach (var row in rows) await DeleteModelAsync(row, ct);
        }

        /// <summary>
        /// 刪除選單主表資料
        /// </summary>
        private async Task DeleteMenuItemRowsAsync(string siteIndex, HashSet<int> deleteIds, CancellationToken ct = default)
        {
            var rows = await QueryRowsByItemRowIdsAsync<SiteMenu_Item>(siteIndex, nameof(SiteMenu_Item.RowId), deleteIds, ct);
            foreach (var row in rows.OrderByDescending(x => x.Level)) await DeleteModelAsync(row, ct);
        }

        /// <summary>
        /// 依 ItemRowId 批次查詢
        /// </summary>
        private async Task<List<TModel>> QueryRowsByItemRowIdsAsync<TModel>(string siteIndex, string rowIdName, HashSet<int> rowIds, CancellationToken ct = default)
        {
            if (rowIds.Count == 0) return [];

            var ids = string.Join(",", rowIds.Where(x => x > 0).Distinct());
            var data = await DoQueryListAsync<TModel>([], $"{nameof(SiteMenu_Item.SiteIndex)} = '{SqlValue(siteIndex)}' AND {rowIdName} IN ({ids})", default, 0, 0);
            return data.Cast<TModel>().ToList();
        }

        /// <summary>
        /// 更新站台修改資訊
        /// </summary>
        private async Task TouchSiteMenuIndexAsync(SiteMenu_IndexModel oldIndex, CancellationToken ct = default)
        {
            var newIndex = oldIndex.Snapshot();
            SetModifyInfo(newIndex);
            await UpdateModelAsync(oldIndex, newIndex, ct);
        }

        /// <summary>
        /// 取得儲存用選單 RowId
        /// </summary>
        private int ResolveSaveMenuItemRowId(List<SiteMenu_Item> oldItems, SaveMenuItem_DTO request)
        {
            if (request.RowId != null && request.RowId > 0) return request.RowId.Value;
            return oldItems.Count == 0 ? 1 : oldItems.Max(x => x.RowId) + 1;
        }

        /// <summary>
        /// 建立選單多語標題資料
        /// </summary>
        private List<SiteMenu_Item_Title> BuildMenuItemTitles(string siteIndex, int itemRowId, SaveMenuItem_DTO request)
        {
            int nextRowId = 1;
            List<SiteMenu_Item_Title> result = [];

            foreach (var source in request.Titles ?? [])
            {
                var rowId = source.RowId != null && source.RowId > 0 ? source.RowId.Value : nextRowId;
                nextRowId = Math.Max(nextRowId, rowId + 1);

                result.Add(new SiteMenu_Item_Title()
                {
                    SiteIndex = siteIndex,
                    ItemRowId = itemRowId,
                    RowId = rowId,
                    Lang = source.Lang ?? EffectiveLang,
                    Title = source.Title,
                    IsShowOnMenu = source.IsShowOnMenu,
                });
            }

            return result;
        }

        /// <summary>
        /// 建立選單網址設定資料
        /// </summary>
        private SiteMenu_Item_Url? BuildMenuItemUrl(string siteIndex, int itemRowId, SaveMenuItemUrl_DTO? source)
        {
            if (source == null) return null;

            return new SiteMenu_Item_Url()
            {
                SiteIndex = siteIndex,
                ItemRowId = itemRowId,
                RedirectType = source.RedirectType,
                RedirectUrl = source.RedirectUrl,
            };
        }

        /// <summary>
        /// 建立選單模組設定資料
        /// </summary>
        private SiteMenu_Item_Module? BuildMenuItemModule(string siteIndex, int itemRowId, SaveMenuItemModule_DTO? source)
        {
            if (source == null) return null;

            return new SiteMenu_Item_Module()
            {
                SiteIndex = siteIndex,
                ItemRowId = itemRowId,
                BannerId = source.BannerId,
                PageType = source.PageType,
                ModuleProgId = source.ModuleProgId,
                ModuleOptions = source.ModuleOptions,
            };
        }

        /// <summary>
        /// 新增資料
        /// </summary>
        private async Task CreateModelAsync<TModel>(TModel model, CancellationToken ct = default)
        {
            var repo = (dynamic)RepoDict[typeof(TModel).Name];
            await repo.CreateAsync((dynamic)model);
        }

        /// <summary>
        /// 更新資料
        /// </summary>
        private async Task UpdateModelAsync<TModel>(TModel oldModel, TModel newModel, CancellationToken ct = default)
        {
            var repo = (dynamic)RepoDict[typeof(TModel).Name];
            await repo.UpdateAsync((dynamic)oldModel, (dynamic)newModel);
        }

        /// <summary>
        /// 刪除資料
        /// </summary>
        private async Task DeleteModelAsync<TModel>(TModel model, CancellationToken ct = default)
        {
            var repo = (dynamic)RepoDict[typeof(TModel).Name];
            await repo.DeleteAsync((dynamic)model);
        }

        /// <summary>
        /// SQL 字串值防呆
        /// </summary>
        private string SqlValue(string? value)
        {
            return (value ?? string.Empty).Replace("'", "''");
        }
        /// <summary>
        /// 新增項目時，重新整理同層 DisplayOrder
        /// </summary>
        private void NormalizeNewMenuItemOrder(List<SiteMenu_Item> items, int newRowId)
        {
            var target = items.FirstOrDefault(x => x.RowId == newRowId);
            if (target == null) return;

            var insertOrder = Math.Max((byte)1, target.DisplayOrder);
            var siblings = items
                .Where(x => x.RowId != newRowId && x.ParentRowId == target.ParentRowId)
                .OrderBy(x => x.DisplayOrder)
                .ThenBy(x => x.RowId)
                .ToList();

            target.DisplayOrder = insertOrder.ToByte();

            int order = 1;
            foreach (var item in siblings)
            {
                if (order == insertOrder) order++;
                item.DisplayOrder = order.ToByte();
                order++;
            }
        }
        #endregion
    }
}
