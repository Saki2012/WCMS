
import { useId } from 'react';
import type { ILibCalendarProp } from './LibCalendar_Data';

const LibCalendar=(prop:ILibCalendarProp)=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.colDisplayName}</label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                <div className="Date input-group input-daterange">
                    <span className="input-group-text"><i className="fal fa-calendar-alt"></i></span>
                    <input id={inputId} type="text" className="start-date form-control dateicon" placeholder="YYYY / MM / DD" value="YYYY / MM / DD"/>
                </div>
            </div>
        </>
    );
}

export default LibCalendar;