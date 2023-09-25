import React, { useState, useEffect } from 'react';
import {debounce} from 'lodash';
import './HomePage.css';
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import {db} from '../../firebase'
import {useAuth} from '../../contexts/AuthContexts'


export default function HomePage({articles, formatDescription, apiKey }) {
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

 /* Fetches articles from news API and queries for each main company stored in companyNames. It is stored in responses and a promise is resolved when all the API fetches have completed. The articles is flattened into just an array of independent articles, and filtered.*/
 const fetchArticles = async () => {
    try {
      const responses = await Promise.all(
        companyNames.map(async (companyName) => {
          const response = await fetch(
            `https://newsapi.org/v2/everything?q=${companyName}&apiKey=${apiKey}&page=${page}&pageSize=${pageSize}`
          )
          const data = await response.json();
          return data.articles;
        })
      )

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

  // Fetch articles every time the page number changes
  useEffect(() => {
    fetchArticles()
  }, [page]);

  // Scroll function that increments page number when scrolling to the bottom
  function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && loading) {
      setPage(prevPage => prevPage + 1)
      setLoading(true)
    }
  }
  // Retrieves saved article URLs from firebase database based on user ID
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

  // When the user logs in, it will load the saved articles
  useEffect(() => {
    loadSavedArticles();
    
  }, [currentUser]);

  // Debounce handle scroll function to prevent overuse and unnecessary API calls when fetching
  const debouncedHandleScroll = debounce(handleScroll, 250);

  useEffect(() => {
    window.addEventListener("scroll", debouncedHandleScroll);

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page]);


  function generateIdFromUrl(url) { // Utility function for toggleSaveArticles. Replaces special characters with an underscore and then hashes the URL.
    const sanitisedUrl = url.replace(/[/\\.#$]/g, '_')
    return hashCode(sanitisedUrl)
  }

  function hashCode(str) { // Utilty  function for simple hashing of URL. This hash was not made by me. It goes through each character index of the string and shifts the bits to the left by 5, get this result and subtracts it by the original bit and adds the character code at the end. Overall this function could be any hashing algorithm as long as it prevents collisions when hashing many URLs. Finally it converts the numerical bits into a String as a hash.
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
    }
    return String(hash)
  }

  /*
    This function is for when a user is interacting with a star image inside the rendered article.  If a user is logged in, the function will get the hashed article URL and check if it is in the savedArticles collection. If it exists it will then delete the document from the collection therefore removing it from savedArticles for the user. If it does not exist it will instead save the document with user id, hashed URL and keywords of article title (for fetching the articles through API in SavedArticles page). It will also save the document's hashed URL and original URL inside the collection 'hashedToOriginalURLs'.  Finally it will be added to the savedArticles state array.

    **an issue I noticed is that hashedURL is not a unique identifier across many users. I would like to fix this in the future but as of right now it won't be fixed just to demonstrate that the functionality works between firestore.
  */

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
         const keywords = article.title.split(' ')

        await setDoc(articleRef, {
          user: currentUser.uid, 
          url: articleId,
          keywords: keywords
        })
        const originalURLRef = doc(db, 'hashedToOriginalURLs', articleId);
        await setDoc(originalURLRef, {
          originalURL: article.url,
        })
        setSavedArticles((prevSavedArticles) => [
          ...prevSavedArticles,
          { hashedURL: articleId, originalURL: article.url, keywords: keywords },
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