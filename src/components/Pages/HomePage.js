import React, { useState, useEffect } from 'react';
import {debounce} from 'lodash';
import './HomePage.css';

export default function HomePage({articles, formatDescription }) {
  const apiKey = '2a8a8b489e2e43b0af552d15e840cc38';
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
      const realArticles = newArticles.filter(article => (
        article.url && article.title && article.author && article.urlToImage && article.publishedAt && article.content
      ));
      const uniqueArticles = realArticles.filter(
        (article, index, self) => index === self.findIndex(a => a.url === article.url)
      );
      setNewsData(prevNewsData => [...prevNewsData, ...uniqueArticles]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page]);

  function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && loading){
      setPage(prevPage => prevPage + 1);
      setLoading(true);
    }
  }

  const debouncedHandleScroll = debounce(handleScroll, 250);

  useEffect(() => {
    window.addEventListener("scroll", debouncedHandleScroll);

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page]);

  return (
    <div className="article-section">
      <div className="article-container">
        {(articles.length > 0 ? articles : newsData).map(article => (
          <div key={article.url} className="article">
            <h2>{article.title}</h2>
            <h4>{article.author}</h4>
            <img src={article.urlToImage} alt={article.title} />
            <p className="description">{formatDescription(article.content)}</p>
            <div className="info">
              <p>{new Date(article.publishedAt).toLocaleDateString()}</p>
              <p>{article.source.name}</p>
            </div>
            <a target="_blank" href={article.url}>Read more</a>
          </div>
        ))}
        {loading && <div className="loading-indicator">Loading...</div>}
      </div>
    </div>
  );
}