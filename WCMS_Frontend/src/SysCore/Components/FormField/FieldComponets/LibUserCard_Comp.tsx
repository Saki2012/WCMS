import { useId } from 'react';
import type { ILibUserCardProp } from './LibUserCard_Data';
import { Link } from 'react-router-dom';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { LangLink } from '@/SysCore/i18n/LangLink';
// import { Link } from 'react-router-dom';

const LibUserCard = (prop: ILibUserCardProp) => {
    const inputFileId = useId();
    return (
        <>
            <div className={`panel ${prop.Style?.Bgstyle}`}>
                <div className="panel-body">
                    <div className="form">
                        <div className="row mx-0">
                            <div className="col form-group mb-0">
                                <div className="row mx-0">
                                    <div className="float-md-left p-0">
                                        <div className="userlist-box">
                                            <div className="card mb-0">
                                                <div className="card-body text-center w-100">
                                                    <div className="avatar_box">
                                                        <label htmlFor={inputFileId}>
                                                            <figure className="avatar-figure custom-lg mb-0" >
                                                                <img src={prop.PicSrc} className="rounded-circle" />
                                                            </figure>
                                                        </label>
                                                        {
                                                            prop.Style?.LinkType === "ImageUpload" ?
                                                                <div className="avatar-photo">
                                                                    <div className="PiconBox">
                                                                        <input type="file" className="avatar-input" id={inputFileId} /><i className="far fa-camera-alt camera"></i>
                                                                    </div>
                                                                </div>
                                                                : prop.Style?.LinkType === "Edit" ?
                                                                    <div className="avatar-photo">
                                                                        <div className="PiconBox">
                                                                            <LangLink to={prop.dirUrl ?? ""} className="avatar-input" title={prop.DisplayNameTW} target="_self"><i className="far fa-user-edit"></i></LangLink>
                                                                        </div>
                                                                    </div>
                                                                    : <></>
                                                        }
                                                    </div>
                                                    <div className="avatar_name_box m-t-30">
                                                        <p className="nickname text-black-50"><span className="mx-2">—</span>{prop.DisplayNameEN}<span className="mx-2">—</span></p>
                                                        <h4 className="avatar-title fw-bold my-1">
                                                            {prop.DisplayNameTW}
                                                        </h4>
                                                        <p className="enname text-black-50">{prop.DisplayRole}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LibUserCard;
