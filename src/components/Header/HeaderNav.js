import React, { useState, useEffect } from "react";
import {debounce} from "lodash";
import "./HeaderNav.css";

const apiKey = "2a8a8b489e2e43b0af552d15e840cc38";
const pageSize = 5;

const companyNames = [
  "Amazon",
  "NVIDIA",
  "Google",
  "Meta",
  "Microsoft",
  "Tesla",
  "Apple"
];

export default function HeaderNav({ onSearch }) {
  const [searchKeywords, setSearchKeywords] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);

  const debouncedAPICall = debounce(searchTerm => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const keywordsArray = searchTerm.split(" ").filter(keyword => keyword.trim() !== "");
    const keywordQuery = keywordsArray.join(" OR ");

    const companyQuery = companyNames.join(" OR ");

    const apiUrl = `https://newsapi.org/v2/everything?q=${companyQuery} ${keywordQuery}&apiKey=${apiKey}&pageSize=${pageSize}&sortBy=relevancy&language=en`;

    fetch(apiUrl)
      .then(response => response.json())
        .then(data => {
        const filteredArticles = data.articles.filter(article => (
          article.url && article.title && article.author && article.urlToImage && article.publishedAt && article.content
        ));
        setSearchResults(filteredArticles);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, 300);

  const handleSearch = event => {
    const searchTerm = event.target.value;
    setSearchKeywords(searchTerm);

    debouncedAPICall(searchTerm);
  };

    useEffect(() => {
    if (searchKeywords.trim() === "") {
      setSearchResults([]);
      return;
    }

    // Rest of your code...

  }, [searchKeywords]);


  const handleInputFocus = () => {
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };


return (
    <div className="header-nav">
      <div className="nav-section">
        <ul className="company-list">
          {companyNames.map((companyName, index) => (
            <li key={index}>{companyName}</li>
          ))}
        </ul>
        <div className="search-container">
          <input
            className="search"
            type="text"
            value={searchKeywords}
            onChange={handleSearch}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur} 
            placeholder={inputFocused ? "" : "Search trending articles..."}
          />
        </div>
      </div>
      <div className="article-container">
        {searchResults.map(article => (
          <div key={article.url} className="article">
            <h2>{article.title}</h2>
            <h4>{article.author}</h4>
            <img src={article.urlToImage} alt={article.title} />
            <p className="description">{article.description}</p>
            <div className="info">
              <p>{new Date(article.publishedAt).toLocaleDateString()}</p>
              <p>{article.source.name}</p>
            </div>
            <a target="_blank" href={article.url}>Read more</a>
          </div>
        ))}
      </div>
    </div>
  );
}