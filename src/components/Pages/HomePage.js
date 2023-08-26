import React, {useState, useEffect} from 'react'

export default function HomePage() {
  const NewsAPI = require('newsapi');
  const newsapi = new NewsAPI('2a8a8b489e2e43b0af552d15e840cc38');
  const [newsData, setNewsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    newsapi.v2.sources({
      category: 'technology',
      language: 'en',
      country: 'us'
    }).then(response => {
      console.log(response);
      // Here, you can set the response data to your component's state
    });
  }, [])

  return(
    <div className="article-section">
      {loading ?
        <p>loading...</p> :
          <div className="news">
            {newsData.map(article => (
              <div key={article.id} className="news-article"></div>
            ))}
          </div>  
      }
    </div>
  )
}