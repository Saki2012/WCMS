using Microsoft.AspNetCore.Mvc;
using NLog;
using System;
using System.Globalization;
using System.IO;
using System.Resources;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static GraphQL.Validation.Rules.OverlappingFieldsCanBeMerged;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore
{
    public interface IErrorHelper
    {
        public IList<SysMessageModel> Messages { get; set; }
        public void AddMessage(MessageStatus status, string code,params object[] args);
        public bool HasError { get { return Messages.Any(m => m.Status == MessageStatus.Error); } }
    }
    public class ErrorHelper:IErrorHelper
    {
        public enum LogType { info, oprate, error }
        public IList<SysMessageModel> Messages { get; set; } = [];
        public void AddMessage(MessageStatus status, string code, params object[] args)
        {
            Messages.Add(new SysMessageModel()
            {
                Status=status,
                MessageCode=code,
                Message= ResxMsg.Msg(code,args),
            });
        }
    }

    internal static class ResxMsg
    {
        // "組件的根命名空間.資料夾.檔名前綴"
        private static readonly ResourceManager RM =
            new("WCMS.SysCore.Resx.SysMessageCode", typeof(SysMessageCode).Assembly);

        public static string Msg(string code, params object[] args)
        {
            var text = RM.GetString(code, CultureInfo.CurrentUICulture);
            if (string.IsNullOrEmpty(text)) return $@"【{code}】";                  // 找不到就回傳 code（方便除錯）
            return (args?.Length > 0) ? string.Format(text, args) : text; // 支援 {0} 參數
        }
    }
}
