namespace WCMS.SysCore.FeatureDriver.Model.MetaData;

/// <summary>
/// 標示組合式 Form Model 的 Root Property。
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class FormRootAttribute : Attribute { }

/// <summary>
/// 標示 Form Model Property 對應到 Root DbModel 的 Graph Path。
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class FormGraphPathAttribute(string rootPath) : Attribute
{
    #region Property
    /// <summary>
    /// Root DbModel 上的實際 Graph Path。
    /// </summary>
    public string RootPath { get; } = rootPath;
    #endregion
}
