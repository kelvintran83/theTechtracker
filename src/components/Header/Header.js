import React from "react";
import './Header.css';

export default function Header(props){

  const company = props.stockChanges[props.currentChangeIndex][0]
  const companyStockChange = props.stockChanges[props.currentChangeIndex][1]
  const stockTracker = `${company} ${companyStockChange}`

  return(
    <header>
      
      <div className="stock-section">
        <div className="date-section">
          <h3>Today's Date: {props.currentDate}</h3>
        </div>
        <p className="change">{stockTracker}</p>
      </div>
      <div className="title-section">      
        <div className="header-icon">
          <div className="circle">
            <span className="icon-text">tTt</span>
          </div>
          <span className="site-title">the Tech tracker</span>
        </div>
      </div>

      <div className="user-section">
        <button className="sign-up-button">Sign up</button>
        <button className="log-in-button">Log in </button>
      </div>
    </header>
  )
}