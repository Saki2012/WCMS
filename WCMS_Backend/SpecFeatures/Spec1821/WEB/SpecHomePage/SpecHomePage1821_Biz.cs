using System.Text.Json;
using System.Text.Json.Serialization;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821招生首頁設定商業邏輯
/// </summary>
[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting)]
public class SpecHomePage1821_Biz(BizDeps bizDeps) : BizService<SpecHomePage1821Set>(bizDeps), IBizService<SpecHomePage1821Set>
{
    #region Property
    private static readonly JsonSerializerOptions OptionsJsonSerializerOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    #endregion

    #region Protected
    protected override async Task BeforeUpdate(SpecHomePage1821Set set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                NormalizeData(set);
                CheckData(set);
                break;
        }
    }
    #endregion

    #region Private
    private void CheckData(SpecHomePage1821Set set)
    {
        CheckHeader(set.SpecHomePage1821);
        CheckBanner(set.SpecHomePage1821_Banner);
        CheckShortcut(set.SpecHomePage1821_Shortcut, set.SpecHomePage1821_ShortcutModuleItem);
        CheckShortcutModuleItem(set.SpecHomePage1821_ShortcutModuleItem);
    }

    private static void NormalizeData(SpecHomePage1821Set set)
    {
        set.SpecHomePage1821_Banner ??= [];
        set.SpecHomePage1821_Shortcut ??= [];
        set.SpecHomePage1821_ShortcutModuleItem ??= [];

        if (set.SpecHomePage1821 != null)
        {
            set.SpecHomePage1821.Card1PicId = NormalizeRelationId(set.SpecHomePage1821.Card1PicId);
            set.SpecHomePage1821.Card2PicId = NormalizeRelationId(set.SpecHomePage1821.Card2PicId);
            set.SpecHomePage1821.LinkOptions = NormalizeOptionsJson(set.SpecHomePage1821.LinkOptions);
        }

        NormalizeBanner(set.SpecHomePage1821_Banner);
        NormalizeShortcut(set.SpecHomePage1821_Shortcut);
        NormalizeShortcutModuleItem(set.SpecHomePage1821_ShortcutModuleItem, set.SpecHomePage1821_Shortcut);
    }

    private void CheckHeader(SpecHomePage1821Model header)
    {
        if (header == null)
        {
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<SpecHomePage1821Set_DTO>(x => x.SpecHomePage1821));
            return;
        }

        CheckRequired(header.Lang, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.Lang));
        CheckRequired(header.Card1Title, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card1Title));
        CheckRequired(header.Card1PicId, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card1PicId));
        CheckRequired(header.Card2Title, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card2Title));
        CheckRequired(header.Card2PicId, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card2PicId));
        CheckRequired(header.Section4Title, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.Section4Title));
        CheckRequired(header.Section4SubTitle, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.Section4SubTitle));
        CheckRequired(header.LinkViewMore, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.LinkViewMore));
        CheckUrl(header.LinkViewMore);
        CheckOptionsJson(header.LinkOptions, I18nCache.GetLabel<SpecHomePage1821Model_DTO>(x => x.LinkOptions));
    }

    private void CheckBanner(List<SpecHomePage1821_Banner> rows)
    {
        foreach (var row in rows)
        {
            CheckRequired(row.RowNo, I18nCache.GetLabel<SpecHomePage1821_Banner_DTO>(x => x.RowNo));
            CheckRequired(row.BannerFileId, I18nCache.GetLabel<SpecHomePage1821_Banner_DTO>(x => x.BannerFileId));
            CheckUrl(row.Link);
        }
    }

    private void CheckShortcut(List<SpecHomePage1821_Shortcut> rows, List<SpecHomePage1821_ShortcutModuleItem> moduleItems)
    {
        foreach (var row in rows)
        {
            CheckRequired(row.RowNo, I18nCache.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.RowNo));
            CheckRequired(row.IconFileId, I18nCache.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.IconFileId));
            CheckRequired(row.Title, I18nCache.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.Title));

            if (row.IsLink)
            {
                CheckRequired(row.Link, I18nCache.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.Link));
                CheckRequired(row.LinkPicId, I18nCache.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.LinkPicId));
                CheckUrl(row.Link);
                continue;
            }

            bool hasVisibleModuleItem = moduleItems.Any(item => item.ParentRowId == row.RowId && !item.IsHide);
            if (!hasVisibleModuleItem) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<SpecHomePage1821Set_DTO>(x => x.SpecHomePage1821_ShortcutModuleItem));
        }
    }

    private void CheckShortcutModuleItem(List<SpecHomePage1821_ShortcutModuleItem> rows)
    {
        foreach (var row in rows)
        {
            CheckRequired(row.ParentRowId, I18nCache.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.ParentRowId));
            CheckRequired(row.RowNo, I18nCache.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.RowNo));
            CheckRequired(row.Title, I18nCache.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.Title));
            CheckRequired(row.ModuleOptions, I18nCache.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.ModuleOptions));
            CheckRequired(row.MoreViewLink, I18nCache.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.MoreViewLink));
            CheckModuleType(row.ModuleType);
            CheckOptionsJson(row.ModuleOptions, I18nCache.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.ModuleOptions));
            CheckUrl(row.MoreViewLink);
        }
    }

    private static void NormalizeBanner(List<SpecHomePage1821_Banner> rows)
    {
        for (int i = 0; i < rows.Count; i++)
        {
            rows[i].BannerFileId = NormalizeRelationId(rows[i].BannerFileId);
            if (rows[i].RowNo <= 0) rows[i].RowNo = i + 1;
        }
    }

    private static void NormalizeShortcut(List<SpecHomePage1821_Shortcut> rows)
    {
        for (int i = 0; i < rows.Count; i++)
        {
            rows[i].IconFileId = NormalizeRelationId(rows[i].IconFileId);
            rows[i].LinkPicId = NormalizeRelationId(rows[i].LinkPicId);
            if (rows[i].RowNo <= 0) rows[i].RowNo = i + 1;

            if (rows[i].IsLink) continue;
            rows[i].Link = string.Empty;
            rows[i].LinkPicId = null;
        }
    }

    private static void NormalizeShortcutModuleItem(List<SpecHomePage1821_ShortcutModuleItem> rows, List<SpecHomePage1821_Shortcut> shortcuts)
    {
        HashSet<int> linkParentRowIds = shortcuts.Where(item => item.IsLink).Select(item => item.RowId).ToHashSet();
        rows.RemoveAll(item => linkParentRowIds.Contains(item.ParentRowId));

        Dictionary<int, int> rowIndexByParent = [];
        foreach (var row in rows)
        {
            row.ModuleOptions = NormalizeOptionsJson(row.ModuleOptions);

            if (!rowIndexByParent.ContainsKey(row.ParentRowId)) rowIndexByParent[row.ParentRowId] = 0;
            rowIndexByParent[row.ParentRowId]++;
            if (row.RowNo <= 0) row.RowNo = rowIndexByParent[row.ParentRowId];
        }
    }

    private static string NormalizeOptionsJson(string? options)
    {
        if (options.IsNullOrEmpty()) return SerializeOptions(new HomePageOptions());
        if (!TryParseOptions(options, out HomePageOptions parsed)) return options;

        parsed.CategoryIds = parsed.CategoryIds.Remerge(",");
        parsed.TagIds = parsed.TagIds.Remerge(",");
        return SerializeOptions(parsed);
    }

    private static string? NormalizeRelationId(string? relationId)
    {
        return relationId.IsNullOrEmpty() ? null : relationId;
    }

    private static string SerializeOptions(HomePageOptions options)
    {
        return JsonSerializer.Serialize(options, OptionsJsonSerializerOptions);
    }

    private void CheckRequired(string? value, string fieldName)
    {
        if (value.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, fieldName);
    }

    private void CheckRequired(int value, string fieldName)
    {
        if (value <= 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, fieldName);
    }

    private void CheckUrl(string? url)
    {
        if (!url.IsNullOrEmpty() && !LibData.UrlChecks.IsHttpOrRelativeUrl(url)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00027, url);
    }

    private void CheckModuleType(SpecHomePageModuleType moduleType)
    {
        if (moduleType is SpecHomePageModuleType.Announcement or SpecHomePageModuleType.FileArchive) return;
        Message.AddMessage(MessageStatus.Error, SpecMessageCode.SpecBECode0001, I18nCache.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.ModuleType));
    }

    private void CheckOptionsJson(string? options, string fieldName)
    {
        if (options.IsNullOrEmpty()) return;
        if (TryParseOptions(options, out _)) return;
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, fieldName);
    }

    private static bool TryParseOptions(string? options, out HomePageOptions result)
    {
        result = new();
        if (options.IsNullOrEmpty()) return false;

        try
        {
            result = JsonSerializer.Deserialize<HomePageOptions>(options, OptionsJsonSerializerOptions) ?? new();
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
    #endregion
}

internal sealed class HomePageOptions
{
    [JsonPropertyName("categoryIds")] public string CategoryIds { get; set; } = string.Empty;
    [JsonPropertyName("tagIds")] public string TagIds { get; set; } = string.Empty;
}
