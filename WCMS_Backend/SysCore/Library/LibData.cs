namespace WCMS.SysCore.Library;

/// <summary>
/// 暫存尚待移往 ErrorHandling 單元的共用 Exception 處理。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 取得例外鏈最內層的 Exception。
    /// </summary>
    public static Exception GetInnermostException(this Exception ex)
    {
        Exception innerEx = ex;
        while (innerEx.InnerException is Exception next) innerEx = next;
        return innerEx;
    }
    #endregion
}
