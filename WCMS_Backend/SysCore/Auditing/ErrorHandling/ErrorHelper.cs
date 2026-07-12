using System.Globalization;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Auditing.ErrorHandling;

public interface IErrorHelper
{
    public IList<SysMessageModel> Messages { get; set; }
    public void AddMessage(List<SysMessageModel> messages);
    public void AddMessage(MessageStatus status, string code,params object[] args);
    public void AddMessage(SysMessageModel message);
    public bool HasError { get { return Messages.Any(m => m.Status == MessageStatus.Error); } }
}
public class ErrorHelper:IErrorHelper
{
    public enum LogType { info, oprate, error }
    public IList<SysMessageModel> Messages { get; set; } = [];

    #region Public
    public void AddMessage(List<SysMessageModel> msgs) {foreach (var msg in msgs) AddMessage(msg);}
    public void AddMessage(SysMessageModel msg) {Messages.Add(msg);}
    public void AddMessage(MessageStatus status, string code, params object[] args){AddMessage(new SysMessageModel(){Status = status,MessageCode = code,Message = GetResxMsg(code, args),});}

    public static string GetResxMsg(string code, params object[] args)
    {
        // 1) 讀 core SysMessageCode
        var coreBaseName = typeof(SysMessageCode).FullName!;

        var specBaseName = string.IsNullOrWhiteSpace(SpecSettings.SpecCode) ? null : $"WCMS.SpecFeatures.{SpecSettings.SpecCode}.Resx.SpecMessageCode";
        var asm = typeof(SysMessageCode).Assembly;
        var text = LibResxReader.TryGetSpecOrCore(coreBaseName, specBaseName, asm, code, CultureInfo.CurrentUICulture);
        // 2) 找不到就回傳 code（方便除錯）
        if (string.IsNullOrWhiteSpace(text)) return $@"【{code}】";
        // 3) 支援 {0} 參數
        return (args?.Length > 0) ? string.Format(text, args) : text;
    }
    #endregion
}
