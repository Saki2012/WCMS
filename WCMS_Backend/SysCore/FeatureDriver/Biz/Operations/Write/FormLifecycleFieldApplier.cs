using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write;

/// <summary>
/// 套用 Form Aggregate 的建立、修改、作廢與保留欄位。
/// </summary>
internal sealed class FormLifecycleFieldApplier<TFormModel>(Func<User_DTO> operateUserAccessor, PropertyAccessorCache propertyAccessor)
    where TFormModel : class
{
    #region Property
    private Func<User_DTO> OperateUserAccessor { get; } = operateUserAccessor;
    private PropertyAccessorCache PropertyAccessor { get; } = propertyAccessor;
    #endregion

    #region Internal
    /// <summary>
    /// 套用新增時的建立與修改資訊。
    /// </summary>
    internal void ApplyCreate(HeaderModel header)
    {
        DateTime now = DateTime.Now;
        User_DTO user = OperateUserAccessor();
        header.CreateUserId = user.UserId;
        if (header.CreateTime == null) header.CreateTime = now;
        header.ModifyUserId = user.UserId;
        if (header.ModifyTime == null) header.ModifyTime = now;
        // 業務流程已預先建立 InternalId 時必須保留，避免 DB 與實體資源識別碼不一致。
        if (string.IsNullOrWhiteSpace(header.InternalId)) header.InternalId = Guid.NewGuid().ToString();
    }
    /// <summary>
    /// 套用修改時的使用者與時間。
    /// </summary>
    internal void ApplyModify(HeaderModel header)
    {
        DateTime now = DateTime.Now;
        header.ModifyUserId = OperateUserAccessor().UserId;
        header.ModifyTime = now;
    }
    /// <summary>
    /// 套用作廢或恢復狀態。
    /// </summary>
    internal void ApplyInvalid(TFormModel data, bool isInvalid)
    {
        if (FormModelMetadataResolver.GetRootModel(data) is not HeaderModel header) return;
        header.DataStatus = isInvalid ? DataStatus.Invalid : DataStatus.Valid;
        header.FormStatus = isInvalid ? FormStatus.Obsoleted : FormStatus.Saved;
        header.InvalidTime = isInvalid ? DateTime.UtcNow : null;
        header.InvalidUserId = isInvalid ? OperateUserAccessor()?.UserId : string.Empty;
    }
    /// <summary>
    /// 保留既有建立資訊，避免外部更新覆蓋系統欄位。
    /// </summary>
    internal void PreserveCreateInfo(TFormModel oldData, TFormModel newData)
    {
        DbModel oldRoot = FormModelMetadataResolver.GetRootModel(oldData);
        DbModel newRoot = FormModelMetadataResolver.GetRootModel(newData);
        CopyValue(oldRoot, newRoot, nameof(HeaderModel.CreateUserId));
        CopyValue(oldRoot, newRoot, nameof(HeaderModel.CreateTime));
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊 Root 指定欄位值複製至新 Root。
    /// </summary>
    private void CopyValue(DbModel oldRoot, DbModel newRoot, string propertyName)
    {
        object? value = PropertyAccessor.Get(oldRoot, propertyName);
        PropertyAccessor.Set(newRoot, propertyName, value);
    }
    #endregion
}
