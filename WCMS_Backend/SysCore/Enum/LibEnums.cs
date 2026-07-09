namespace WCMS.SysCore.Enum
{
    /// <summary>
    /// 排序方式
    /// </summary>
    public enum RemergeSortMode
    {
        /// <summary>
        /// 自動偵測
        /// </summary>
        Auto,
        /// <summary>
        /// 不排序
        /// </summary>
        None,
        /// <summary>
        /// 純文字
        /// </summary>
        String,
        /// <summary>
        /// 數字
        /// </summary>
        Number,
        /// <summary>
        /// 自然語言
        /// </summary>
        Natural
    }

    /// <summary>
    /// API 欄位讀寫模式。
    /// </summary>
    public enum ApiFieldMode
    {
        /// <summary>
        /// API 可讀可寫。
        /// </summary>
        ReadWrite,

        /// <summary>
        /// API 可讀不可寫。
        /// </summary>
        ReadOnly,

        /// <summary>
        /// API 可寫不可讀。
        /// </summary>
        WriteOnly,

        /// <summary>
        /// API 不可讀不可寫。
        /// </summary>
        Ignore
    }
}
