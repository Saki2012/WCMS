using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.Features.IAM.RolePermission;

public class RolePermissionBiz(
    BizDeps bizDeps,
    RolePermissionCatalogCache catalogCache,
    PermissionCache permissionCache) : BizService<RoleDataModel>(bizDeps), IBizService<RoleDataModel>
{
    #region Property
    private RolePermissionCatalogCache CatalogCache { get; } = catalogCache;
    /// <summary>
    /// 使用者有效權限 Cache。
    /// </summary>
    private PermissionCache PermissionCache { get; } = permissionCache;
    /// <summary>
    /// 本次交易提交後需失效權限的帳號。
    /// </summary>
    private HashSet<string> PendingPermissionUserIds { get; } = new(StringComparer.OrdinalIgnoreCase);
    #endregion

    #region Public
    /// <summary>
    /// 取得「權限功能目錄」：Module → Progs（給前端 RolePermission UI 直接渲染）。
    /// </summary>
    public IList<PermissionCatalogModuleDTO> GetPermissionCatalog()
    {
        IReadOnlyList<RolePermissionCatalogModule> catalog = CatalogCache.GetCatalog();
        return catalog.Select(BuildModuleDto).ToList();
    }
    /// <summary>
    /// 清除 Catalog Cache，下一次呼叫會重新掃描 Controller Action。
    /// </summary>
    public void ClearPermissionCatalogCache()
    {
        CatalogCache.Clear();
    }
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 角色權限異動完成但尚未提交時，記錄所有受影響帳號。
    /// </summary>
    protected override async Task AfterUpdate(
        RoleDataModel? oldSet,
        RoleDataModel? newSet,
        FuncAction act,
        TransStatus status,
        CancellationToken ct = default)
    {
        await base.AfterUpdate(oldSet, newSet, act, status, ct);
        string[] roleIds = ResolveAffectedRoleIds(oldSet, newSet);
        List<string> userIds = await PermissionCache.LoadUserIdsByRolesAsync(roleIds, ct);
        PendingPermissionUserIds.UnionWith(userIds);
    }
    /// <summary>
    /// 交易成功提交後失效受角色權限異動影響的使用者權限 Cache。
    /// </summary>
    protected override async Task AfterSaveChanges(FuncAction action, CancellationToken ct = default)
    {
        await base.AfterSaveChanges(action, ct);
        await PermissionCache.InvalidateUsersAsync(PendingPermissionUserIds, CancellationToken.None);
        PendingPermissionUserIds.Clear();
    }
    #endregion

    #region Private
    /// <summary>
    /// 合併角色權限異動前後可能影響的角色代號。
    /// </summary>
    private static string[] ResolveAffectedRoleIds(RoleDataModel? oldSet, RoleDataModel? newSet)
    {
        return new[] { oldSet?.RoleId, newSet?.RoleId }
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
    /// <summary>
    /// 將權限模組結構組成目前語系的回傳 DTO。
    /// </summary>
    private PermissionCatalogModuleDTO BuildModuleDto(RolePermissionCatalogModule module)
    {
        string moduleCode = module.ModuleCode.ToString();
        List<PermissionCatalogProgDTO> progs = module.Progs.Select(BuildProgDto).ToList();
        return new PermissionCatalogModuleDTO
        {
            ModuleCode = moduleCode,
            ModuleTitle = I18n.GetResourceLabel(moduleCode),
            Progs = progs,
        };
    }
    /// <summary>
    /// 將權限程式結構組成目前語系的回傳 DTO。
    /// </summary>
    private PermissionCatalogProgDTO BuildProgDto(RolePermissionCatalogProg prog)
    {
        return new PermissionCatalogProgDTO
        {
            ProgId = prog.ProgId,
            ProgTitle = I18n.GetResourceLabel(prog.ProgId),
            SupportMask = prog.SupportMask,
        };
    }
    #endregion
}
