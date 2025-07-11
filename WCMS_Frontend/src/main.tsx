import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import App from './App.tsx'
import HeaderMetaComp from './SysCore/Components/HeaderMeta/HeaderMeta_Comp.tsx'
import { BrowserRouter } from "react-router-dom";

// const cssList = [
// "/Legacy/Server/ContentBack/bootstrap-5.1.1/css/bootstrap.min.css",
// "/Legacy/Server/ContentBack/bootstrap-5.1.1/css/docs.css",
// "/Legacy/Server/fonts/tabler/tabler-icons.min.css",
// "/Legacy/Server/fonts/feather/feather.css",
// "/Legacy/Server/fonts/font-awesome-pro-5/css/all.css",
// "/Legacy/Server/css/Header.css",
// "/Legacy/Server/css/Sidebar-Menu.css",
// "/Legacy/Server/css/Footer.css",
// "/Legacy/Server/css/style_Admin_All.css",
// "/Legacy/Server/css/style_class_kit.css",
// "/Legacy/Server/css/style_background_color.css",
// "/Legacy/Server/ContentBack/nestable/nestable.css",
// "/Legacy/Server/ContentBack/table_rwd/table_rwd.css",
// "/Legacy/Server/ContentBack/bootstrap-datepicker1.6.1/bootstrap-datepicker1.6.1.css",
// "/Legacy/Server/ContentBack/login/login_NewDesige.css",
// "/Legacy/Server/ContentBack/register/register_NewDesige.css",
// "/Legacy/Server/ContentBack/animate/animate.css",
// "/Legacy/Server/ContentBack/bg_dynamic/login-Particles.css",
// "/Legacy/Server/ContentBack/chart_c3_0.7.20/css/c3.css",
// "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600&display=swap",
// ]

// cssList.forEach((href) => {
//   const link = document.createElement('link')
//   link.rel = 'stylesheet'
//   link.href = href
//   document.head.appendChild(link)
// })

// const jsList = [
// "/Legacy/Server/ContentBack/jquery-3.7.1/jquery-3.7.1.min.js",
// "/Legacy/Server/ContentBack/jquery-3.7.1/bootstrap.js",
// "/Legacy/Server/ContentBack/bootstrap-5.1.1/js/bootstrap.bundle.min.js",
// "/Legacy/Server/fonts/feather/feather.min.js",
// "/Legacy/Server/ContentBack/ckeditor_4.22.1_full/ckeditor/ckeditor.js",
// "/Legacy/Server/js/simplebarv6.2.5.min.js",
// "/Legacy/Server/js/Custompcoded.js",
// "/Legacy/Server/ContentBack/nestable/jquery-1.12.4.min.js",
// "/Legacy/Server/ContentBack/nestable/jquery.nestable.js",
// "/Legacy/Server/ContentBack/bootstrap-datepicker1.6.1/bootstrap-datepicker1.6.1.min.js",
// "/Legacy/Server/ContentBack/repeater/jquery-1.11.1.js",
// "/Legacy/Server/ContentBack/repeater/jquery.repeater.js",
// "/Legacy/Server/ContentBack/chart_c3_0.7.20/css/c3.min.js",
// "/Legacy/Server/ContentBack/chart_c3_0.7.20/css/d3-5.8.2.min.js",
// ]

// jsList.forEach((src) => {
//   const script = document.createElement('script')
//   script.src = src
//   script.async = false // 確保依序執行（jQuery -> Bootstrap -> CKEditor）
//   document.body.appendChild(script)
// })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      {createPortal(<HeaderMetaComp />, document.head)}
      <BrowserRouter>
        <App/>
      </BrowserRouter>
  </StrictMode>,
)
