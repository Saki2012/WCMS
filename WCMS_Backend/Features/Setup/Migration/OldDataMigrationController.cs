using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.Auditing.OperateLog;
using WCMS.SysCore.Constants;
using WCMS.SysCore.Security.Hardening.AccessControl;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 提供僅限本機執行的標準 Feature 舊資料匯入入口。
/// </summary>
[ApiController, Route(SysParam.ApiRoutes.SystemService)]
public sealed class OldDataMigrationController(OldDataMigrationService migrationService, IOperateLog operateLog) : ControllerBase
{
    #region Property
    /// <summary>
    /// 保留既有系統 API 操作日誌名稱。
    /// </summary>
    private const string SystemApiName = "SystemAPI";
    #endregion

    #region Public
    /// <summary>
    /// 匯入舊站實體檔案與標準 Feature 資料，忽略所有 SpecFeatures。
    /// </summary>
    [HttpPost(nameof(Migration)), LocalhostOnly]
    public async Task<IActionResult> Migration(string labelTag = OldDataMigrationSource.DefaultImportLabel, CancellationToken ct = default)
    {
        OperateLogModel followInfo = new()
        {
            APIName = $"{SystemApiName}/{nameof(Migration)}",
            UserId = "SysOperator",
            IP = Request.Headers[SysParam.HttpHeaders.ClientIp].ToString(),
        };
        operateLog.AddOperateLog(followInfo);
        await migrationService.MigrateAsync(labelTag, ct);
        return Ok();
    }
    #endregion
}
