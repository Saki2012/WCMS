import { useId } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { isSameDay } from "date-fns";
import type { ILibCalendarProp } from './LibCalendar_Data';



const LibCalendar = (prop: ILibCalendarProp) => {
    const inputId = useId();
    return (
        <>
            <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">
                {prop.ColumnDisplayName}
            </label>
            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                <div className="Date input-group input-daterange">
                    <span className="input-group-text">
                        <i className="fal fa-calendar-alt"></i>
                    </span>
                    <DatePicker
                        id={inputId}
                        selected={prop.InputValue ? new Date(prop.InputValue) : null}
                        onChange={(date) => {
                            const dateStr = date ? date.toISOString() : "";
                            prop.onChange?.(dateStr);
                        }}
                        dateFormat="yyyy / MM / dd"
                        placeholderText="YYYY / MM / DD"
                        autoComplete="off"

                        className="start-date form-control dateicon"
                        calendarClassName="shadow-lg rounded-md border border-gray-300 p-2"
                        dayClassName={(date) => {
                            let className = "";
                            if (isSameDay(date, new Date())) {
                                className += " bg-blue-100 text-blue-800 rounded-full";
                            }
                            return className.trim();
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default LibCalendar;