import React,{useState, useEffect} from "react"
import { useAuth } from '../../contexts/AuthContexts'
import {db} from "../../firebase"
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'

export default function SavedArticlesPage({formatDescription}) {

  const {currentUser} = useAuth()
  const [savedArticles, setSavedArticles] = useState([])
  const [renderArticles, setRenderArticles] = useState([])
  const apiKey = '2a8a8b489e2e43b0af552d15e840cc38'

   async function loadSavedArticles() {
      try {
        if (currentUser) {
          const userSavedArticlesCollectionRef = collection(db, 'savedArticles');
          const userSavedArticlesQuery = query(
            userSavedArticlesCollectionRef,
            where('user', '==', currentUser.uid)
          )

          const querySnapshot = await getDocs(userSavedArticlesQuery);
          const savedArticlesData = []

          for (const docu of querySnapshot.docs) {
            const data = docu.data();
            const { keywords, url, user } = data;

            const originalURLRef = doc(db, 'hashedToOriginalURLs', url);
            const originalURLDoc = await getDoc(originalURLRef);

            if (originalURLDoc.exists()) {
              const originalURL = originalURLDoc.data().originalURL;

              savedArticlesData.push({
                keywords,
                url: originalURL, 
                user,
              });
            } else {
              console.error(`Original URL not found for hashed URL: ${url}`)
            }
          }
          console.log(savedArticlesData);
          setSavedArticles(savedArticlesData);
        }
      } catch (error) {
        console.error('Error loading saved articles:', error);
      }
    }

  useEffect(() => {
    loadSavedArticles();
  }, []);



  async function fetchSavedArticlesData() {
    try {
      const pageSize = 1

      if (savedArticles.length === 0) {
        return
      }



      const articleDataPromises = savedArticles.map(async (savedArticle) => {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${savedArticle.keywords.join(
            ' '
          )}&apiKey=${apiKey}&pageSize=${pageSize}`
        )
        const data = await response.json();
        return data.articles;
      })

      const savedArticleData = await Promise.all(articleDataPromises);
      const articles = savedArticleData.flatMap((articleData) => articleData);
      console.log("These are meant to be articles:" + articles)

      setRenderArticles(articles);
    } catch (error) {
      console.error('Error fetching saved articles data:', error);
    }
  }

  useEffect(() => {
    if (savedArticles.length > 0) {
      fetchSavedArticlesData()
    }
  }, [savedArticles])

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
            (savedArticle) => savedArticle.url != article.url
          )
        );
      } else {
        const keywords = article.title.split(' ');

        await setDoc(articleRef, {
          user: currentUser.uid,
          url: articleId,
          keywords,
        });
        const originalURLRef = doc(db, 'hashedToOriginalURLs', articleId);
        await setDoc(originalURLRef, {
          originalURL: article.url,
        })
        setSavedArticles((prevSavedArticles) => [
          ...prevSavedArticles,
          { hashedURL: articleId, originalURL: article.url, keywords },
        ]);
      }
    } catch (error) {
      console.error("Error saving article:", error);
    }
  }

  function generateIdFromUrl(url) {
    const sanitisedUrl = url.replace(/[/\\.#$]/g, '_');
    return hashCode(sanitisedUrl);
  }

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }
    return String(hash);
  }

  return (
    <div className="article-section">
      <div className="article-container">
        {renderArticles.map((article) => (
          <div key={article.url} className="article" >
            <h2>{article.title}</h2>
            <div className="info">
              <h4>{article.author}</h4>
              {currentUser && (
                <img
                  src={savedArticles.some(
                    (savedArticle) => savedArticle.url === article.url
                  )
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
      </div>
    </div>
  );
}