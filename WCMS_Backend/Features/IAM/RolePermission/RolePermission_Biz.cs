using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.IAM.RolePermission
{
    public class RolePermissionBiz(BizDeps bizDeps, IActionDescriptorCollectionProvider adcp) : BizService<RolePermissionSet>(bizDeps), IBizService<RolePermissionSet>
    {
        #region Cache
        // Catalog 來源是 Attribute（很少變動），用 static cache 減少每次掃描成本
        private static readonly object _catalogLock = new();
        private static IList<PermissionCatalogModuleDTO>? _catalogCache;
        #endregion

        #region Public
        /// <summary>
        /// 取得「權限功能目錄」：Module → Progs（給前端 RolePermission UI 直接渲染）
        /// </summary>
        public IList<PermissionCatalogModuleDTO> GetPermissionCatalog()
        {
            return GetOrBuildPermissionCatalog(adcp);
        }

        /// <summary>
        /// 清除 Catalog 快取（通常只有開發期才需要）
        /// </summary>
        public void ClearPermissionCatalogCache()
        {
            // 清空快取，下一次呼叫會重新掃描
            lock (_catalogLock) _catalogCache = null;
        }
        #endregion

        #region Private

        /// <summary>
        /// 判斷此 Controller 是否允許出現在「當前 Spec 的權限目錄」
        /// - Core(非 SpecFeatures) 一律允許
        /// - SpecFeatures 只允許 WCMS.SpecFeatures.{SpecCode}.*
        /// </summary>
        private static bool IsAllowedBySpec(ControllerActionDescriptor cad)
        {
            // 宣告變數
            var ns = cad.ControllerTypeInfo.Namespace ?? string.Empty;
            var specCode = SysCore.Library.SpecSettings.SpecCode ?? string.Empty;

            // Core 區（不在 SpecFeatures）一律允許
            if (!ns.StartsWith("WCMS.SpecFeatures.", StringComparison.OrdinalIgnoreCase)) return true;

            // SpecCode 沒設定：保守起見全開（你也可改成全關）
            if (string.IsNullOrWhiteSpace(specCode)) return true;

            // 只允許當前 Spec 的 namespace
            return ns.StartsWith($"WCMS.SpecFeatures.{specCode}.", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// 從快取取 Catalog；若沒有就建置（thread-safe）
        /// </summary>
        private static IList<PermissionCatalogModuleDTO> GetOrBuildPermissionCatalog(IActionDescriptorCollectionProvider adcp)
        {
            // 先快路徑
            var cached = _catalogCache;
            if (cached != null) return cached;

            // 加鎖建置一次
            lock (_catalogLock)
            {
                if (_catalogCache != null) return _catalogCache;
                _catalogCache = BuildPermissionCatalog(adcp);
                return _catalogCache;
            }
        }

        /// <summary>
        /// 掃描所有 action 的 LibApiControllerAttribute，組合成 Module → Progs
        /// </summary>
        private static IList<PermissionCatalogModuleDTO> BuildPermissionCatalog(IActionDescriptorCollectionProvider adcp)
        {
            // moduleCode → module DTO
            var modules = new Dictionary<string, PermissionCatalogModuleDTO>(StringComparer.OrdinalIgnoreCase);

            // 將 meta 合併進 modules（同 ProgId 會 OR SupportMask）
            foreach (var meta in EnumeratePermissionMetas(adcp)) UpsertModuleProg(modules, meta);

            // 排序輸出（先 module，再 prog）
            return SortModules(modules.Values);
        }

        /// <summary>
        /// 列舉所有 action 上/其 controller 上的 LibApiControllerAttribute（允許重複，後續會合併）
        /// </summary>
        private static IEnumerable<LibApiControllerAttribute> EnumeratePermissionMetas(IActionDescriptorCollectionProvider adcp)
        {
            foreach (var ad in adcp.ActionDescriptors.Items)
            {
                if (ad is not ControllerActionDescriptor cad) continue;
                if (!IsAllowedBySpec(cad)) continue;

                var meta = GetPermissionMeta(cad);
                if (meta == null) continue;

                // 宣告變數：把 enum 轉回舊版字串
                var moduleCode = GetModuleCodeText(meta);

                // 執行：過濾無效資料
                if (string.IsNullOrWhiteSpace(moduleCode)) continue;
                if (string.IsNullOrWhiteSpace(meta.ProgId)) continue;

                yield return meta;
            }
        }

        /// <summary>
        /// Action 優先，其次 Controller（跟你 ApiDataController 取 meta 的邏輯一致）
        /// </summary>
        private static LibApiControllerAttribute? GetPermissionMeta(ControllerActionDescriptor cad)
        {
            // Action 上的 meta
            var actionMeta = cad.MethodInfo.GetCustomAttributes(typeof(LibApiControllerAttribute), true)
                .OfType<LibApiControllerAttribute>()
                .FirstOrDefault();
            if (actionMeta != null) return actionMeta;

            // Controller 上的 meta
            var ctrlMeta = cad.ControllerTypeInfo.GetCustomAttributes(typeof(LibApiControllerAttribute), true)
                .OfType<LibApiControllerAttribute>()
                .FirstOrDefault();
            return ctrlMeta;
        }

        /// <summary>
        /// 將掃描到的 meta 合併進 Module/Prog 結構
        /// </summary>
        private static void UpsertModuleProg(Dictionary<string, PermissionCatalogModuleDTO> modules, LibApiControllerAttribute meta)
        {
            // 宣告變數：把 enum 統一轉回舊版字串
            var moduleCode = GetModuleCodeText(meta);

            // 取得/建立 module
            if (!modules.TryGetValue(moduleCode, out var mod))
            {
                mod = new PermissionCatalogModuleDTO
                {
                    ModuleCode = moduleCode,
                    ModuleTitle = GetModuleTitle(moduleCode), // i18n 顯示名稱（找不到就 fallback code）
                    Progs = []
                };
                modules.Add(moduleCode, mod);
            }

            // 取得/建立 prog（同 ProgId 合併 SupportMask）
            var prog = mod.Progs.FirstOrDefault(x => x.ProgId.Equals(meta.ProgId, StringComparison.OrdinalIgnoreCase));
            if (prog == null)
            {
                mod.Progs.Add(new PermissionCatalogProgDTO
                {
                    ProgId = meta.ProgId,
                    ProgTitle = GetProgTitle(meta.ProgId), // i18n 顯示名稱（找不到就 fallback id）
                    SupportMask = meta.SupportFuncActMask
                });
                return;
            }

            prog.SupportMask |= meta.SupportFuncActMask;
        }

        /// <summary>
        /// 將 ModuleCode enum 轉為舊版字串，避免影響既有 DTO / resx / 前端邏輯
        /// </summary>
        private static string GetModuleCodeText(LibApiControllerAttribute meta)
        {
            return meta.ModuleCode.ToString();
        }

        /// <summary>
        /// 排序 module 與其底下 progs（先用 code 排，之後有 Sort 再補）
        /// </summary>
        private static IList<PermissionCatalogModuleDTO> SortModules(IEnumerable<PermissionCatalogModuleDTO> modules)
        {
            foreach (var m in modules) m.Progs = m.Progs.OrderBy(x => x.ProgId, StringComparer.OrdinalIgnoreCase).ToList();
            return modules.OrderBy(x => x.ModuleCode, StringComparer.OrdinalIgnoreCase).ToList();
        }

        /// <summary>
        /// 依 ModuleCode 取得顯示名稱（resx key：PermissionCatalog_Module_{ModuleCode}）
        /// </summary>
        private static string GetModuleTitle(string moduleCode)
        {
            return GetI18nTitle(moduleCode);
        }

        /// <summary>
        /// 依 ProgId 取得顯示名稱（resx key：PermissionCatalog_Prog_{ProgId}）
        /// </summary>
        private static string GetProgTitle(string progId)
        {
            return GetI18nTitle(progId);
        }

        /// <summary>
        /// 用 LibDescAttribute 讀 resx，若找不到就回傳 fallback（避免顯示 [key]）
        /// </summary>
        private static string GetI18nTitle(string resKey)
        {
            var title = new LibDescAttribute(resKey).Description;
            if (string.IsNullOrWhiteSpace(title)) return $@"[{resKey}]";
            if (title.Equals($"[{resKey}]", StringComparison.Ordinal)) return $@"[{resKey}]";
            return title;
        }

        #endregion
    }
}