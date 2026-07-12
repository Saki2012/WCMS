using System.ComponentModel;
using WCMS.SysCore.FeatureDriver.Model.MetaData;
namespace WCMS.SysCore.I18n.Metadata;


/// <summary>
/// 欄位/Function名稱描述 
/// (透過.resx支援多語系)
/// </summary>
[AttributeUsage(AttributeTargets.All, Inherited = false, AllowMultiple = false)]
public sealed class LibDescAttribute : DescriptionAttribute, ILibDisplayAttr
{
    #region Property
    private string? _resourceKey;
    private string? _aliasKey;
    #endregion

    #region Public
    /// <summary>
    /// 主要顯示名稱資源 Key。
    /// </summary>
    public string? DescKey => _resourceKey;

    /// <summary>
    /// 別名顯示名稱資源 Key。
    /// </summary>
    public string? AliasKey => _aliasKey;

    /// <summary>
    /// 建立欄位顯示名稱描述，第二參數會優先作為顯示名稱。
    /// </summary>
    public LibDescAttribute(string resKey = "", string aliasKey = "")
    {
        SetInitialKeys(resKey, aliasKey);
    }

    /// <summary>
    /// 沒有指定資源 Key 時，補上欄位名稱作為預設 Key。
    /// </summary>
    public void SetResourceKey(string key)
    {
        _resourceKey = key;
    }

    /// <summary>
    /// 取得多語系描述文字。
    /// </summary>
    public override string Description
    {
        get
        {
            var result = GetDescriptionText();
            return result;
        }
    }
    #endregion

    #region Private
    /// <summary>
    /// 初始化主要 Key 與別名 Key。
    /// </summary>
    private void SetInitialKeys(string resKey, string aliasKey)
    {
        if (!resKey.IsNullOrEmpty()) _resourceKey = resKey;
        if (!aliasKey.IsNullOrEmpty()) _aliasKey = aliasKey;
    }

    /// <summary>
    /// 依序取得別名、主要名稱、 fallback 名稱。
    /// </summary>
    private string GetDescriptionText()
    {
        var result = LibDisplayAttributeHelper.GetDescriptionText(this);
        return result;
    }
    #endregion
}