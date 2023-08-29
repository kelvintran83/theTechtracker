import React, {useEffect, useState, useRef} from "react";
import './Header.css';

 export default function Header() {

  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)
  const [currentDate, setCurrentDate] = useState("")
  const intervalRef=useRef(null)

  const stockChanges = [
    ["apple",'2.5%'],
    ["microsoft", '1%'],
    ["amazon", '2.5%'],
    ["meta",'1%'],
    ["nvidia",'2.5%'],
    ["google",'1%']
  ]

  
  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    setCurrentDate(formattedDate);
  }, [])

  const stockTracker = `${stockChanges[currentChangeIndex][0]} ${stockChanges[currentChangeIndex][1]}`;

    useEffect(() => {
      // Start the interval
      intervalRef.current = setInterval(() => {
        setCurrentChangeIndex((prevIndex) => (prevIndex + 1) % stockChanges.length);
      }, 3000);

      // Clear the interval when the component unmounts
      return () => {
        clearInterval(intervalRef.current);
      };
    }, []);

  return(
    <header>
      
      <div className="stock-section">
        <div className="date-section">
          <h3>Today's Date: {currentDate}</h3>
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
