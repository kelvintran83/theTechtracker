import React, { useState } from 'react';
import './App.css';
import HeaderNav from './components/Header/HeaderNav';
import Header from './components/Header/Header';
import HomePage from './components/Pages/HomePage';
import CompanyPage from './components/Pages/CompanyPage';
import SignUp from './components/Pages/SignUpPage';
import LogIn from './components/Pages/LogInPage';
import SavedArticles from './components/Pages/SavedArticlesPage'
import {Route, Routes} from 'react-router-dom'


function App() {
  // Persist the search results between pages
  const [searchResults, setSearchResults] = useState([]);
  const apiKey= process.env.REACT_APP_API_KEY

  // Function for HeaderNav's search bar to use and set the search state for the app
  function handleSearch(searchTerm) {
    setSearchResults(searchTerm);
  }

  // Utility function for reducing the description of articles before rendering
  function formatDescription(desc) {
    if (desc) {
      return desc.substring(0, 200);
    }
    return '';
  }

  return (
      <div className="App">
        <Header />
        <HeaderNav onSearch={handleSearch} formatDescription={formatDescription} apiKey={apiKey}/>   
          <Routes>    
            <Route path="/" exact element={
              <HomePage articles={searchResults} formatDescription={formatDescription} apiKey={apiKey}/>
            }/>
            <Route path="/:companyName" exact element={
              <CompanyPage  articles={searchResults} formatDescription={formatDescription} apiKey={apiKey}/>
            }/>

            <Route path="/signup" element={
              <SignUp />
            }/>

            <Route path="/login" element={
              <LogIn />
            }/>
            <Route path="/savedarticles" element={
              <SavedArticles formatDescription={formatDescription} apiKey={apiKey}/>
            }/>

          </Routes> 
      </div>
  )
}


export default App;