import React, {useEffect, useState, useRef} from "react";
import {Link} from "react-router-dom"
import './Header.css';
import { useAuth} from "../../contexts/AuthContexts"

  /*
    No longer using the Alpha Vantage API due to limited requests (5 per minute), unable to use without premium, hopefully in the future with an available monthly budget this feature can be enabled. For now the code will be commented and dummy tracker used instead. The functionality does work with the Alpha Vantage API.
  */
 export default function Header() {

  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)
  const [currentDate, setCurrentDate] = useState("")
  // const [stockData, setStockData] = useState({})
  const intervalRef=useRef(null)
  const { currentUser, logout } = useAuth();


   const stockSymbols = ["AAPL", "MSFT", "AMZN", "META", "NVDA", "GOOGL"];
  //  const apiKey = "LKPBJE8527DH4CKG";
  //  this apikey is for Alpha Vantage not newsAPI

    const dummyStockData = { //hard code company data as of 08/31/2023
    AAPL: {
      "2023-08-31": {
        "1. open": "187.87"
      }
    },    
    NVDA: {
      "2023-08-31": {
        "1. open": "493.55"
      }
    },    
    GOOGL: {
      "2023-08-31": {
        "1. open": "136.17"
      }
    },    
    META: {
      "2023-08-31": {
        "1. open": "295.89"
      }
    },
    MSFT: {
      "2023-08-31": {
        "1. open": "327.76"
      }
    },
    TSLA: {
      "2023-08-31": {
        "1. open": "258.08"
      }
    },
    AMZN: {
      "2023-08-31": {
        "1. open": "138.01"
      }
    }



  }

  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    setCurrentDate(formattedDate);
  }, [])

  /*  Below is the original stock tracker, it fetches JSON datathrough the get endpoint. This is based on the stockSymbol array that is commented. The map function should return 7 responses which is executed and stored in fetchdData aray.


  useEffect(() => {
    const fetchDataForAllSymbols = async () => {
      const fetchDataPromises = stockSymbols.map(symbol => {
        const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
        return fetch(apiUrl)
          .then(response => response.json())
          .then(data => ({ symbol, data }))
          .catch(error => {
            console.error(`Error fetching stock data for ${symbol}:`, error);
            return { symbol, data: null };
          });
      });
      
      // The reduce function maps the fetchedData array based on the symbol value. The symbol value acts as a key and data are the values returned from the symbol key
      const fetchedData = await Promise.all(fetchDataPromises);
      const dataMap = fetchedData.reduce((map, { symbol, data }) => {
        map[symbol] = data;
        return map;
      }, {});

      setStockData(dataMap);
      console.log("Fetched Data:", dataMap);
    };

    fetchDataForAllSymbols();
  }, []);


  */


    // use React's reference functionality, the function inside setInterval runs every 3 seconds. The function increases the index of the current index in currentChangeIndex by 1. By using modulo the index should reset past the length of the stockSymbols array, creating a cycle. The intervalRef is needed to be able to call clearInterval when unmounting the useEffect

    useEffect(() => {

      intervalRef.current = setInterval(() => {
        setCurrentChangeIndex((prevIndex) => (prevIndex + 1) % stockSymbols.length);
      }, 3000);


      return () => {
        clearInterval(intervalRef.current);
      };
    }, []);



  return(

    //contains JSX for rendering a stockTracker based on original implementation with Alpha Vantage as well as the live version using the dummyStockData array

    <header>
      <div className="stock-section">
        <div className="date-section">
          <h3 className="date-text">Today's Date: {currentDate}</h3>
        </div>
        {/* <p className="change">
          {stockData[stockSymbols[currentChangeIndex]] &&
          stockData[stockSymbols[currentChangeIndex]]["Time Series (Daily)"] &&
          stockData[stockSymbols[currentChangeIndex]]["Time Series (Daily)"][currentDate] &&
          stockData[stockSymbols[currentChangeIndex]]["Time Series (Daily)"][currentDate]["1. open"]} USD
          {currentDate}
        </p> */}
        <p className="change">
          <span>{stockSymbols[currentChangeIndex]}  </span>
          {dummyStockData[stockSymbols[currentChangeIndex]] &&
          dummyStockData[stockSymbols[currentChangeIndex]]["2023-08-31"] &&
          dummyStockData[stockSymbols[currentChangeIndex]]["2023-08-31"]["1. open"]} USD
        </p>
      </div>
        <Link to="/" style={{ "textDecoration" : "none"}}>
          <span >
            <div className="title-section">      
              <div className="header-icon">
                <div className="circle">
                  <span className="icon-text">tTt</span>
                </div>
                <span className="site-title">the Tech tracker</span>
              </div>
            </div>
          </span>
        </Link>
      

       {currentUser ? (
          
          <div className="user-section">

            <Link to="/savedarticles" >
              <button className="saved-articles-button">Saved Articles</button>
            </Link>            
            <Link to ="/"><button onClick={logout} className="log-out-button">
              Log Out
            </button>
            </Link>
          </div>
        ) : (
          <div className="user-section">
        <Link to="/signup"><button className="sign-up-button">Sign up</button></Link>
        <Link to="/login"><button className="log-in-button">Log in </button></Link>
         </div>
        )}
    </header>

  )


  }
