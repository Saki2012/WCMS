import LoadingErrorHandler from "../../../../../../SysCore/Components/LoadingErrorHandler";
import type { ContentCompProp } from "./FormView_Data";
import { useNavigate } from 'react-router-dom';

export const ContentComp = (prop: ContentCompProp) => {
  return (
    <>
      <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
        <Content {...prop}></Content>
      </LoadingErrorHandler>
    </>
  );
}


const Content = (prop: ContentCompProp) => {
  const navigate = useNavigate();
  const handleBack: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();         // 取代 return false
    navigate(-1);              // 回到上一頁
  };
  return (<>
    <div className="page-header mb-3">
      <h3>{prop.Title}</h3>
      <i className="fa fa-calendar"></i>{` ${prop.StartDate.toString()}`}
      {prop.Category && prop.Category.length > 0 && (
        <><i className="fa fa-tags ml-3"></i>{` ${prop.Category.join('、')}`}</>
      )}
      {prop.Tag && prop.Tag.length > 0 && (
        <><i className="fa fa-bookmark ml-3"></i>{` ${prop.Tag.join('、')}`}</>
      )}
    </div>
    {prop.Content}
    <hr />

    {((prop.Href && prop.Href.length > 0) || (prop.Files && prop.Files.length > 0)) &&
      <ul className="list-group">
        {prop.Href && prop.Href.length > 0 && (
          <li>
            <a href={prop.Href} target="_blank" rel="noopener noreferrer" className="btn btn-default">
              <i className="fa fa-link"></i> {prop.Href}
            </a>
          </li>
        )}
        {prop.Files && prop.Files.length > 0 && (
          <>
            {prop.Files.map((file: any, idx: number) => (
              <li key={idx}>
                <a
                  href={file.url ?? ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-default"
                  tabIndex={1}
                  title={`${file.name}(另開新視窗)`}
                >
                  <i className="fa fa-paperclip"></i> {file.name}
                </a>
              </li>
            ))}
          </>
        )}
      </ul>}


    <div className="row">
      <div className="col-lg-8 col-md-8 col-sm-6 col-4"></div>
      <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right">
        <a id="ContentPlaceContent_ContentPlaceConentA_wuc1_btn_edit" className="btn btn-primary btn-custom-color" href="/Back/News/NewsAdd.aspx?action=edit&amp;Sn=249">編輯</a>
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right">
        <button type="button" name="ctl00$ctl00$ContentPlaceContent$ContentPlaceConentA$wuc1$btn_goback" value="回上一頁" onClick={handleBack} id="ContentPlaceContent_ContentPlaceConentA_wuc1_btn_goback" className="btn btn-primary btn-custom-color" title="回上一頁" />
      </div>
    </div>
  </>
  )
}