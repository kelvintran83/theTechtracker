import React, { useState, useEffect } from 'react';
import './HomePage.css';

export default function HomePage() {
  const apiKey = 'ff014538be754c0b84af12098f3a6483';
  const pageSize = 5;

  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const companyNames = [
    'Google',
    'Amazon',
    'Meta',
    'NVIDIA',
    'Microsoft',
    'Tesla',
    'Apple',
  ];

const fetchArticles = async () => {
  try {
    const responses = await Promise.all(
      companyNames.map(companyName =>
        fetch(
          `https://newsapi.org/v2/everything?q=${companyName}&apiKey=${apiKey}&page=${page}&pageSize=${pageSize}`
        ).then(response => response.json())
      )
    );

    const newArticles = responses.flatMap(response => response.articles);
    const uniqueArticles = newArticles.filter(
      (article, index, self) => index === self.findIndex(a => a.url === article.url)
    );
      console.log("Unique articles array:" + uniqueArticles)
    setNewsData(prevNewsData => [...prevNewsData, ...uniqueArticles]);
    console.log("News data state:" + newsData)
    setLoading(false);
  } catch (error) {
    console.error('Error fetching data:', error);
    setLoading(false);
  }
};

useEffect(() => {
  fetchArticles(); // Fetch initial articles
}, []);




  return (
    <div className="article-section">
      <div className="article-container">
        {newsData.map(article => (
          <div key={article.url} className="article">
            <h2>{article.title}</h2>
            <h4>{article.author}</h4>
            <img src={article.urlToImage} alt={article.title} />
            <p className="description">{article.content}</p>
            <div className="info">
              <p>{new Date(article.publishedAt).toLocaleDateString()}</p>
              <p>{article.source.name}</p>
            </div>
            <a href={article.url}>Read more</a>
          </div>
        ))}
        {loading && <div className="loading-indicator">Loading...</div>}

      </div>
    </div>
  );
}