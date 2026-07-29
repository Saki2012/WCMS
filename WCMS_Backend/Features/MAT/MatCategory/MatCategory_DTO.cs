namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// 物件類別動態欄位的前台顯示資料。
/// </summary>
public sealed class MatCategoryInfoFieldItem_DTO
{
    /// <summary>
    /// 後台設定的顯示順序。
    /// </summary>
    public int RowNo { get; set; }
    /// <summary>
    /// MaterialInfoJson 使用的欄位 key。
    /// </summary>
    public string Field { get; set; } = string.Empty;
    /// <summary>
    /// 依目前語系 fallback 後的欄位名稱。
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;
}
