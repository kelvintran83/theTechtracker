import React, {useState, useEffect} from 'react'
import './HomePage.css'


export default function HomePage() {

  const apiKey = '2a8a8b489e2e43b0af552d15e840cc38';
  const pageSize = 10; // Number of articles to load in one batch

  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);




  useEffect(() => {
    const companyNames = [
      'Google',
      'Amazon',
      'Meta',
      'NVIDIA',
      'Microsoft',
      'Tesla',
      'Apple',
    ];

    const fetchArticles = () => {
      Promise.all(
        companyNames.map(companyName =>
          fetch(
            `https://newsapi.org/v2/everything?q=${companyName}&apiKey=${apiKey}&page=${page}&pageSize=${pageSize}`
          ).then(response => response.json())
        )
      )
        .then(dataArray => {
          // Combine and sort articles from different companies
          const newArticles = dataArray.flatMap(data => data.articles);
          setNewsData(prevNewsData => [...prevNewsData, ...newArticles]); // Append new articles to the state
          setLoading(false); // Set loading to false after fetching data
        })
        .catch(error => {
          // Handle errors
          console.error('Error fetching data:', error);
          setLoading(false); // Set loading to false in case of an error
        });
    };

    fetchArticles(); // Fetch initial articles

    // Add a scroll event listener to load more articles on scroll
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !loading
      ) {
        setPage(prevPage => prevPage + 1); // Increment page to load more articles
        setLoading(true); // Set loading to true while fetching more data
        fetchArticles();
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [page]); // Fetch articles when the page changes


  function formatDescription(desc) {
    if (desc) {
      return desc.substring(0, 200);
    }
    return "";
  }
  return(
    <div className="article-section">
      {loading ?
        <p>loading...</p> :
          
          <div className="article-container">
            {newsData.map(article => (
              <div key={article.url} className="article">
                <h2>{article.title}</h2>
                <h4>{article.author}</h4>
                <img src={article.urlToImage} alt={article.title} />
                <p className="description">
                  {formatDescription(article.content)}
                </p>
                <div className="info">
                  <p>{new Date(article.publishedAt).toLocaleDateString()}</p>
                  <p>{article.source.name}</p>
                </div>
                <a href={article.url}>Read more</a>
              </div>
            ))}
          </div>
      }
    </div>
  )
}