import logo from './logo.svg';
import './App.css';
import HeaderNav from "./components/Header/HeaderNav";
import Header from "./components/Header/Header"
import HomePage from "./components/Pages/HomePage"
import React, { useState, useEffect } from 'react'

function App() {

  const [currentDate, setCurrentDate] = useState("")
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentChangeIndex((prevIndex) => (prevIndex + 1) % stockChanges.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <Header currentDate = {currentDate} stockChanges={stockChanges}  currentChangeIndex = {currentChangeIndex}/>
      <HeaderNav />
      <HomePage />
    </div>
  );
}

export default App;
