// src/Features/Test/TestApiCall.tsx
import { useEffect } from 'react';
import PageManagementProvider from "./Features/Server/Layout/BizFunc/WebManagement/PageManagement/PageManagement_Api"



export const TestApiCall = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await PageManagementProvider().fetchData({pk: ['string1']});
        console.log('✅ 測試 API 成功:', res);
      } catch (error) {
        console.error('❌ 測試 API 失敗:', error);
      }
    };
    fetchData();
  }, []);

  return <div>🔍 測試中，請看 Console！</div>;
};