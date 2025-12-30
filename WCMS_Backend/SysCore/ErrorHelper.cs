using System.Globalization;
using System.Resources;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore
{
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

        public void AddMessage(List<SysMessageModel> msgs) 
        {
            foreach (var msg in msgs) AddMessage(msg);
        }
        public void AddMessage(SysMessageModel msg) 
        {
            Messages.Add(msg);
        }
        public void AddMessage(MessageStatus status, string code, params object[] args)
        {
            AddMessage(new SysMessageModel()
            {
                Status = status,
                MessageCode = code,
                Message = ResxMsg.Msg(code, args),
            });
        }
    }

    internal static class ResxMsg
    {
        // "組件的根命名空間.資料夾.檔名前綴"
        private static readonly ResourceManager RM = new(typeof(SysMessageCode).FullName, typeof(SysMessageCode).Assembly);

        public static string Msg(string code, params object[] args)
        {
            string? text = null;
            try
            {
                text = RM.GetString(code, CultureInfo.CurrentUICulture);
            }
            catch (MissingManifestResourceException)
            {
                // 資源檔沒嵌入 / 沒 neutral 時，避免整包爆掉
                text = null;
            }
            if (string.IsNullOrEmpty(text)) return $@"【{code}】";                  // 找不到就回傳 code（方便除錯）
            return (args?.Length > 0) ? string.Format(text, args) : text; // 支援 {0} 參數
        }
    }
}
