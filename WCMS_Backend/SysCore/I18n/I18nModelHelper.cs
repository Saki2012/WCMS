using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.MetaData;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.Library;

namespace WCMS.SysCore.I18n;

/// <summary>
/// 解析 Type、Property 與 Field 上的 LibDesc／LibField 多語系顯示文字，不保存 Cache。
/// </summary>
internal static class I18nModelHelper
{
    #region Public
    /// <summary>
    /// 取得指定 Type 的多語系顯示文字。
    /// </summary>
    public static string GetLocalizedDescription(Type type)
    {
        ILibDisplayAttr? attr = GetDisplayAttr(type);
        return DoGetLocalizedDescription(type.Name, attr);
    }
    /// <summary>
    /// 取得指定 Property 的多語系顯示文字。
    /// </summary>
    public static string GetLocalizedDescription(PropertyInfo property)
    {
        ILibDisplayAttr? attr = GetDisplayAttr(property);
        return DoGetLocalizedDescription(property.Name, attr);
    }
    /// <summary>
    /// 取得指定 Field 或 Const 的多語系顯示文字。
    /// </summary>
    public static string GetLocalizedDescription(FieldInfo field)
    {
        ILibDisplayAttr? attr = GetDisplayAttr(field);
        return DoGetLocalizedDescription(field.Name, attr);
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得成員上的顯示名稱 Attribute。
    /// </summary>
    private static ILibDisplayAttr? GetDisplayAttr(MemberInfo member)
    {
        return member.GetCustomAttributes(inherit: false).OfType<ILibDisplayAttr>().FirstOrDefault();
    }
    /// <summary>
    /// 依顯示名稱 Attribute 取得 LibDesc 或 Resx 顯示文字。
    /// </summary>
    private static string DoGetLocalizedDescription(string name, ILibDisplayAttr? attr)
    {
        if (attr is LibDescAttribute descAttr && descAttr.DescKey.IsNullOrEmpty() && descAttr.AliasKey.IsNullOrEmpty())
            descAttr.SetResourceKey(name);
        string? result = GetDescriptionText(attr);
        return result.IsNullOrEmpty() ? $"[{name}]" : result;
    }
    /// <summary>
    /// 取得 LibDesc 或 LibField 最終顯示文字。
    /// </summary>
    private static string? GetDescriptionText(ILibDisplayAttr? attr)
    {
        if (attr == null) return null;
        if (attr is LibDescAttribute descAttr) return descAttr.Description;
        return LibDisplayAttributeHelper.GetDescriptionText(attr);
    }
    #endregion
}
