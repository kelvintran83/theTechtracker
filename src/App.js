import React, { useState } from 'react';
import './App.css';
import HeaderNav from './components/Header/HeaderNav';
import Header from './components/Header/Header';
import HomePage from './components/Pages/HomePage';

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
      <HomePage articles={searchResults} formatDescription={formatDescription} />
    </div>
  );
}

export default App;