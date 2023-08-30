import logo from './logo.svg';
import './App.css';
import HeaderNav from "./components/Header/HeaderNav";
import Header from "./components/Header/Header"
import HomePage from "./components/Pages/HomePage"
import React from 'react'

function App() {


  return (
    <div className="App">
      <Header />
      <HeaderNav />
      <HomePage />
    </div>
  );
}

export default App;
