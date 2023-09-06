import React, { useState, useEffect } from 'react';
import {debounce} from 'lodash';
import {useParams} from 'react-router-dom'
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import {db} from '../../firebase'
import {useAuth} from '../../contexts/AuthContexts'


export default function CompanyPage({articles = [], formatDescription}) {
  
  const [companyData, setCompanyData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const { companyName } = useParams();
  const apiKey = "2a8a8b489e2e43b0af552d15e840cc38"
  const [savedArticles, setSavedArticles] = useState([])

  const {currentUser} = useAuth()
  



  const fetchArticles = async () => {

    try{
      const responses =
      await fetch(`https://newsapi.org/v2/everything?q=${companyName}&apiKey=${apiKey}&page=${page}&pageSize=10&sortBy=relevancy&language=en`)
      .then(response => response.json())
      
      console.log(companyName)
      const newArticles = responses.articles
      const realArticles = newArticles.filter(article => (
        article.url && article.title && article.author && article.urlToImage && article.publishedAt && article.content
      ));
      const filteredArticles = realArticles.filter((article, index, self) => index === self.findIndex(a => a.url === article.url)
      )      
      setCompanyData(prevArticles => [...prevArticles, ...filteredArticles])
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
    
  
  };

  useEffect(() => {
    fetchArticles()
  },[page, companyName])

    useEffect(() => {
      setCompanyData([])
      setPage(1)
      setLoading(true)
    }, [companyName])

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
        {(articles.length > 0 ? articles : companyData).map(article => (
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
            <a target="_blank" href={article.url}>Read more</a>
          </div>
        ))}
        {loading && <div className="loading-indicator">Loading...</div>}
      </div>
    </div>
  )
}