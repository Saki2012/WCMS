using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.Features.WEB.Survey;

/// <summary>
/// 欄位輸入類型
/// </summary>
[LibDesc(DisplayName.Enum_LibInputType)]
public enum LibInputType : byte
{
    /// <summary>
    /// 單行文字
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Text)] Text = 1,
    /// <summary>
    /// 多行文字
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_TextArea)] TextArea = 2,
    /// <summary>
    /// Email
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Email)] Email = 3,
    /// <summary>
    /// 電話
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Phone)] Phone = 4,
    /// <summary>
    /// 數字
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Number)] Number = 5,
    /// <summary>
    /// 日期
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Date)] Date = 6,
    /// <summary>
    /// 單選
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Radio)] Radio = 10,
    /// <summary>
    /// 下拉單選
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Select)] Select = 11,
    /// <summary>
    /// 多選
    /// </summary>
    [LibDesc(DisplayName.Enum_LibInputType_Checkbox)] Checkbox = 20
}