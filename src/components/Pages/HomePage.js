import React, { useState, useEffect } from 'react';
import {debounce} from 'lodash';
import './HomePage.css';
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import {db} from '../../firebase'
import {useAuth} from '../../contexts/AuthContexts'


export default function HomePage({articles, formatDescription }) {
  const apiKey = 'ff014538be754c0b84af12098f3a6483'
  const pageSize = 5

  const [newsData, setNewsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [savedArticles, setSavedArticles] = useState([])

  const { currentUser } = useAuth();

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
        companyNames.map(async (companyName) => {
          const response = await fetch(
            `https://newsapi.org/v2/everything?q=${companyName}&apiKey=${apiKey}&page=${page}&pageSize=${pageSize}`
          );
          const data = await response.json();
          return data.articles;
        })
      );

      const newArticles = responses.flatMap(articles => articles);
      const realArticles = newArticles.filter(article => (
        article.url && article.title && article.author && article.urlToImage && article.publishedAt && article.content
      ));
      const uniqueArticles = realArticles.filter(
        (article, index, self) => index === self.findIndex(a => a.url === article.url)
      );

      setNewsData(prevNewsData => [...prevNewsData, ...uniqueArticles]);
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [page]);


  function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && loading) {
      setPage(prevPage => prevPage + 1)
      setLoading(true)
    }
  }

  const loadSavedArticles = async () => {
    try {
      if (currentUser) {
        const userSavedArticlesCollectionRef = collection(db, 'savedArticles');
        const userSavedArticlesQuery = query(
          userSavedArticlesCollectionRef,
          where('user', '==', currentUser.uid) 
        );

        const querySnapshot = await getDocs(userSavedArticlesQuery);
        const savedArticlesData = [];

        querySnapshot.forEach(async (docu) => {
          const hashedURL = docu.id;
          const originalURLRef = doc(db, 'hashedToOriginalURLs', hashedURL);
          const originalURLDoc = await getDoc(originalURLRef);

          if (originalURLDoc.exists()) {
            savedArticlesData.push({
              hashedURL,
              originalURL: originalURLDoc.data().originalURL,
            })
          } else {
            console.error(`Original URL not found for hashed URL: ${hashedURL}`);
          }
        })
        console.log(savedArticlesData)
        setSavedArticles(savedArticlesData);
      }
    } catch (error) {
      console.error('Error loading saved articles:', error);
    }
  }

  useEffect(() => {
    loadSavedArticles();
    
  }, [currentUser]);


  const debouncedHandleScroll = debounce(handleScroll, 250);

  useEffect(() => {
    window.addEventListener("scroll", debouncedHandleScroll);

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page]);


  function generateIdFromUrl(url) {
    const sanitisedUrl = url.replace(/[/\\.#$]/g, '_')
    return hashCode(sanitisedUrl)
  }

  function hashCode(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
    }
    return String(hash)
  }

  async function toggleSaveArticles(article) {
    if (!currentUser) {
      return
    }

    try {
      const articleId = generateIdFromUrl(article.url);
      const articleRef = doc(db, 'savedArticles', articleId);
      const docSnapshot = await getDoc(articleRef);

      if (docSnapshot.exists()) {
        await deleteDoc(articleRef);
        setSavedArticles((prevSavedArticles) =>
          prevSavedArticles.filter(
            (savedArticle) => savedArticle.hashedURL !== articleId
          )
        )
      } else {
        await setDoc(articleRef, {
          user: currentUser.uid, 
          url: articleId,
        })
        const originalURLRef = doc(db, 'hashedToOriginalURLs', articleId);
        await setDoc(originalURLRef, {
          originalURL: article.url,
        })
        setSavedArticles((prevSavedArticles) => [
          ...prevSavedArticles,
          { hashedURL: articleId, originalURL: article.url },
        ])
      }
    } catch (error) {
      console.error("Error saving article:", error)
    }
  }

  return (
    <div className="article-section">
      <div className="article-container">
        {(articles.length > 0 ? articles : newsData).map(article => (
            <div key={article.url} className="article">
              <h2>{article.title}</h2>
              <div className="info">
                <h4>{article.author}</h4>
                {currentUser && (
                  <img
                    src={savedArticles.some((savedArticle) => savedArticle.originalURL === article.url)
                            ? StarIcon
                            : EmptyStarIcon
                        }
                    alt="Star"
                    onClick={() => toggleSaveArticles(article)}
                    className="star-icon"
                  />
                )}
              </div>
              <img src={article.urlToImage} alt={article.title} />
              <p className="description">{formatDescription(article.content)}</p>
              <div className="info">
                <p>{new Date(article.publishedAt).toLocaleDateString()}</p>
                <p>{article.source.name}</p>
              </div>
              <a target="_blank" href={article.url}>
                Read more
              </a>
            </div>
          ))}
        {loading && <div className="loading-indicator">Loading...</div>}
      </div>
    </div>
  )
}