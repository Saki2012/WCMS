import './Style/Legacy/Content/bootstrap-5.1.1/css/bootstrap.min.css';
import './Style/Legacy/Content/Front-content.css'
import './Style/Legacy/Content/Front-index-content.css'
import './Style/Legacy/Content/Front-subpage-content.css'
import './Style/Legacy/Content/menu/custom-menu-subpage.css'
import './Style/Legacy/Content/accesskey/custom_sr-only.css'
import './Style/Legacy/Content/accesskey/custom_accesskey.css'
import './Style/Legacy/Content/login/login.css'
import './Style/Legacy/Content/visitor/visitor.css'
import './Style/Legacy/Content/ContentConentA_table_rwd.css'
import './Style/Legacy/Content/ekko-lightbox/ekko-lightbox.css'
import './Style/Legacy/Content/venobox-master/dist/venobox.min.css'
import './Style/Legacy/Content/Sitemap/Sitemap.css'
import './Style/Legacy/css/style_class_kit.css';
import './Style/Legacy/css/style_background_color.css';
import './Style/Legacy/css/font-awesome-4.7.0/font-awesome-4.7.0.min.css'
import './Style/Legacy/Content/owlcarousel_2/custom_owlcarousel_style.css'
import './Style/Legacy/Content/owlcarousel_2/owl.carousel_v2.3.4.min.css'
import './Style/Legacy/Content/swiper-11.1.14/swiper-bundle.min.css'
import './Style/Legacy/Content/animate/animate.css'
import './Style/Legacy/Content/marquee/marquee-left-loop.css'
import './Style/Legacy/Content/slide-bar/slide-bar.css'
import './Style/Legacy/Content/wow/animate.css'




declare global {
  interface Window {
    bootstrap?: any;
    Swiper?: any;
    $?: any;
  }
}
window.bootstrap = window.bootstrap || {};
window.Swiper = window.Swiper || {};
window.$ = window.$ || (() => {}); 

import { useState,useEffect  } from "react";
// import MasterPage from "./Features/Temp/Page/MasterPage";
import MainContent from "./SpecFetures/1810/MainPage";
import FooterComp from "./Features/Temp/Page/Components/FooterContent";
import HeaderComp from './Features/Temp/Page/Components/HeaderContent';

const footerItems = [
  { Title: "最新消息", URL: "/news" },
  { Title: "關於我們", URL: "/about" },
  { Title: "聯絡資訊", URL: "/contact" },
];


export default function App() {
  return (
    <div>
      <HeaderComp />
      <MainContent />
      <FooterComp items={footerItems}/>
    </div>
  );
}


// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
