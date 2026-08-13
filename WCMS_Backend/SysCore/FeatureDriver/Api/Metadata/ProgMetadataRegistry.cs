using System.Reflection;
using WCMS.Features._Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.SysCore.FeatureDriver.Api.Metadata;

/// <summary>
/// 從 ProgKeys 與 LibDesc 建立後端功能模塊的唯一 Metadata 映射。
/// </summary>
public sealed class ProgMetadataRegistry : IProgMetadataRegistry
{
    #region Property
    private const string ModuleDisplayNamePrefix = "Module_";
    private const string ProgDisplayNamePrefix = "Prog_";
    private readonly IReadOnlyDictionary<string, ProgDefinition> _definitionByProgId;
    #endregion

    #region Construct
    /// <summary>
    /// 掃描 ProgKeys 並建立不可變更的 Prog 定義映射。
    /// </summary>
    public ProgMetadataRegistry() => _definitionByProgId = BuildDefinitionMap();
    #endregion

    #region Public
    /// <summary>
    /// 依 ModuleCode 與 ProgId 取得必要的 Prog Metadata。
    /// </summary>
    public ProgMetadata GetRequired(ModuleCodeEnum moduleCode, string progId)
    {
        string normalizedProgId = (progId ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedProgId)) throw new InvalidOperationException($"{moduleCode} 的 ProgId 不可為空白。");
        if (!_definitionByProgId.TryGetValue(normalizedProgId, out ProgDefinition? definition)) throw new InvalidOperationException($"找不到 ProgId：{normalizedProgId}。請先在 ProgKeys 登錄功能定義。");
        ValidateModuleCode(moduleCode, definition);
        string moduleDisplayNameKey = GetModuleDisplayNameKey(moduleCode);
        return new ProgMetadata(moduleCode, definition.ProgId, moduleDisplayNameKey, definition.ProgDisplayNameKey);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立以 ProgId 為全系統唯一索引的 Prog 定義字典。
    /// </summary>
    private static Dictionary<string, ProgDefinition> BuildDefinitionMap()
    {
        Dictionary<string, ProgDefinition> definitionMap = new(StringComparer.OrdinalIgnoreCase);
        foreach (Type moduleType in GetModuleTypes()) RegisterModule(definitionMap, moduleType);
        return definitionMap;
    }
    /// <summary>
    /// 取得 ProgKeys 內所有模塊定義型別。
    /// </summary>
    private static IEnumerable<Type> GetModuleTypes()
    {
        return typeof(ProgKeys)
            .GetNestedTypes(BindingFlags.Public | BindingFlags.NonPublic)
            .Where(type => type.GetField(nameof(ProgKeys.WEB.Code), BindingFlags.Public | BindingFlags.Static) != null)
            .OrderBy(type => type.FullName, StringComparer.Ordinal);
    }
    /// <summary>
    /// 將單一 ProgKeys 群組中的 Prog 常數登錄到全系統定義字典。
    /// </summary>
    private static void RegisterModule(Dictionary<string, ProgDefinition> definitionMap, Type moduleType)
    {
        ModuleCodeEnum sourceModuleCode = GetModuleCode(moduleType);
        ModuleCodeEnum? fixedModuleCode = sourceModuleCode == ModuleCodeEnum.SPEC ? null : sourceModuleCode;
        foreach (FieldInfo progField in GetProgFields(moduleType))
        {
            ProgDefinition definition = BuildProgDefinition(fixedModuleCode, progField);
            RegisterProg(definitionMap, definition);
        }
    }
    /// <summary>
    /// 取得 ProgKeys 群組宣告的來源 ModuleCode。
    /// </summary>
    private static ModuleCodeEnum GetModuleCode(Type moduleType)
    {
        FieldInfo? codeField = moduleType.GetField(nameof(ProgKeys.WEB.Code), BindingFlags.Public | BindingFlags.Static);
        object? rawValue = codeField?.GetRawConstantValue();
        return rawValue == null
            ? throw new InvalidOperationException($"ProgKeys 群組 {moduleType.FullName} 缺少 Code 定義。")
            : (ModuleCodeEnum)Enum.ToObject(typeof(ModuleCodeEnum), rawValue);
    }
    /// <summary>
    /// 取得 ProgKeys 群組中所有字串 ProgId 常數。
    /// </summary>
    private static IEnumerable<FieldInfo> GetProgFields(Type moduleType)
    {
        return moduleType
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(field => field.FieldType == typeof(string) && field.IsLiteral && !field.IsInitOnly)
            .OrderBy(field => field.Name, StringComparer.Ordinal);
    }
    /// <summary>
    /// 由 Prog 常數及其 LibDesc 建立單一 Prog 定義。
    /// </summary>
    private static ProgDefinition BuildProgDefinition(ModuleCodeEnum? fixedModuleCode, FieldInfo progField)
    {
        string progId = ((string?)progField.GetRawConstantValue() ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(progId))
            throw new InvalidOperationException($"{progField.DeclaringType?.FullName}.{progField.Name} 的 ProgId 不可為空白。");
        LibDescAttribute? displayAttribute = progField.GetCustomAttribute<LibDescAttribute>();
        string displayNameKey = ResolveDisplayNameKey(displayAttribute, $"{ProgDisplayNamePrefix}{progId}");
        return new ProgDefinition(progId, fixedModuleCode, displayNameKey);
    }
    /// <summary>
    /// 登錄 ProgId 並阻擋 Core 或不同 Spec 之間的重複定義。
    /// </summary>
    private static void RegisterProg(Dictionary<string, ProgDefinition> definitionMap, ProgDefinition definition)
    {
        if (definitionMap.TryAdd(definition.ProgId, definition)) return;
        ProgDefinition existing = definitionMap[definition.ProgId];
        throw new InvalidOperationException(
            $"ProgId：{definition.ProgId} 重複登錄。既有 Module={FormatModule(existing.FixedModuleCode)}，" +
            $"重複 Module={FormatModule(definition.FixedModuleCode)}。目前 PermissionKey 僅保存 ProgId，因此必須全系統唯一。");
    }
    /// <summary>
    /// 驗證固定 Module 的 Core Prog 是否被正確使用。
    /// </summary>
    private static void ValidateModuleCode(ModuleCodeEnum moduleCode, ProgDefinition definition)
    {
        if (!definition.FixedModuleCode.HasValue || definition.FixedModuleCode.Value == moduleCode) return;
        throw new InvalidOperationException(
            $"ProgId：{definition.ProgId} 登錄於 {definition.FixedModuleCode.Value}，但目前使用 {moduleCode}。");
    }
    /// <summary>
    /// 取得 ModuleCodeEnum 對應的模塊顯示資源 Key。
    /// </summary>
    private static string GetModuleDisplayNameKey(ModuleCodeEnum moduleCode)
    {
        MemberInfo member = typeof(ModuleCodeEnum).GetMember(moduleCode.ToString()).Single();
        LibDescAttribute? displayAttribute = member.GetCustomAttribute<LibDescAttribute>();
        return ResolveDisplayNameKey(displayAttribute, $"{ModuleDisplayNamePrefix}{moduleCode}");
    }
    /// <summary>
    /// 依 LibDesc 別名、主要 Key、命名慣例依序決定顯示資源 Key。
    /// </summary>
    private static string ResolveDisplayNameKey(LibDescAttribute? displayAttribute, string fallbackKey)
    {
        string aliasKey = displayAttribute?.AliasKey?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(aliasKey)) return aliasKey;
        string descKey = displayAttribute?.DescKey?.Trim() ?? string.Empty;
        return string.IsNullOrWhiteSpace(descKey) ? fallbackKey : descKey;
    }
    /// <summary>
    /// 將可彈性掛載 Module 的 Spec Prog 顯示為 SPEC。
    /// </summary>
    private static string FormatModule(ModuleCodeEnum? moduleCode)
    {
        return moduleCode?.ToString() ?? ModuleCodeEnum.SPEC.ToString();
    }
    /// <summary>
    /// 保存 ProgKeys 掃描出的穩定 Prog 定義。
    /// </summary>
    private sealed record ProgDefinition(string ProgId, ModuleCodeEnum? FixedModuleCode, string ProgDisplayNameKey);
    #endregion
}
