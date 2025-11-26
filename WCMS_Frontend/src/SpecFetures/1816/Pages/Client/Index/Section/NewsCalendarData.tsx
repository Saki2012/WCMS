import { Link } from "react-router-dom";

export const NewsCalendarData = () => {
	return (
		<div className="col-xxl-4 col-xl-4 col-lg-5 col-md-12 col-sm-12 col-12 + offset-xxl-1 offset-xl-1 + order-xxl-2 order-xl-2 order-lg-2 order-md-1 order-sm-1  order-1">
			<div className="Opening_hours_DIV">
				<div className="Opening-content">
					<div className="Date_wrapbox">
						<div className="DateTitleBox">
							<div className="date_black">
								<div className="today-date-box">
									<div className="MM">11月</div>
									<div className="DD">5</div>
								</div>
							</div>
							<div className="text_black">
								<div className="text-description-box">
									<div className="date-week">星期幾..</div>
									<div className="date-Ptit">今日開館時間</div>
									<div className="Input date-time">8:00 ~ 17:00</div>
								</div>
							</div>
							<div className="open_btn_black mt-xl-3 mt-lg-3 mt-md-3 mt-sm-2 mt-2">
								<Link className="Open_btn" to={"/services/services-loan/services-loan-01"}
									tabIndex={0} target="_self" title="詳細開館時間">
									詳細開館時間
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
			<script
				dangerouslySetInnerHTML={{
					__html:
						"                    function updateDateTime() {                      const now = new Date();                      const year = now.getFullYear();                      const month = now.getMonth() + 1;                      const date = now.getDate();                      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];                      const weekday = weekdays[now.getDay()];                      const hours = String(now.getHours()).padStart(2, '0');                      const minutes = String(now.getMinutes()).padStart(2, '0');                      const seconds = String(now.getSeconds()).padStart(2, '0');                      const timeNow = \`${hours}:${minutes}:${seconds}\`;                      // 更新 HTML 中的內容                      document.querySelector('.MM').textContent = \`${month}月\`; // 月份-判斷                      document.querySelector('.DD').textContent = date; // 日期-判斷                      document.querySelector('.date-week').textContent = weekday; // 星期幾-判斷                      document.querySelector('.date-time').textContent = \`${08}:${0}${0} ~ ${17}:${0}${0}\`;  // Input時間-判斷                      //document.querySelector('.now-time').textContent = timeNow;  // 現在時間-判斷                    }                    // 每秒更新一次時間                    setInterval(updateDateTime, 1000);                    // 頁面載入時立即執行一次                    updateDateTime();                  ",
				}}
				type="text/javascript"
			/>
		</div>



	);
};
