import React, { useState } from 'react';
import './App.css';
import HeaderNav from './components/Header/HeaderNav';
import Header from './components/Header/Header';
import HomePage from './components/Pages/HomePage';
import CompanyPage from './components/Pages/CompanyPage';
import {Route, Router, Routes} from 'react-router-dom'


function App() {
  const [searchResults, setSearchResults] = useState([]);

  function handleSearch(searchTerm) {
    setSearchResults(searchTerm);
  }

  function formatDescription(desc) {
    if (desc) {
      return desc.substring(0, 200);
    }
    return '';
  }

  return (
      <div className="App">
        <Header />
        <HeaderNav onSearch={handleSearch} />   
          <Routes>    
            <Route path="/" exact element={
              <HomePage articles={searchResults} formatDescription={formatDescription} />
            }/>
            <Route path="/:companyName" exact element={
              <CompanyPage  articles={searchResults} formatDescription={formatDescription}/>
            
            
            }/>
          </Routes> 
      </div>
  )
}


export default App;