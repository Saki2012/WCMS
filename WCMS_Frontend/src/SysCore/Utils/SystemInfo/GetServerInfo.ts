import { useEffect, useState } from "react";

export const SysCurrentDate = () =>
{
    const [date, setDate] = useState<Date | null>(null);
    useEffect(() =>
    {
        setDate(new Date());

        // fetch("/api/time")
        //   .then((res) => res.text()) // 後端回傳純文字時間字串
        //   .then((text) => {
        //     const serverDate = new Date(text); // 轉換為 Date
        //     setDate(serverDate);
        //   })
        //   .catch((err) => {
        //     console.error("Failed to fetch date:", err);
        //     setDate(new Date()); // fallback 預設為本機時間
        //   });
    }, []);

    return date;
};
