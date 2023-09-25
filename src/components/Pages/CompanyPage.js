import React, { useState, useEffect } from 'react';
import {debounce} from 'lodash';
import {useParams} from 'react-router-dom'
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import {db} from '../../firebase'
import {useAuth} from '../../contexts/AuthContexts'


export default function CompanyPage({articles = [], formatDescription, apiKey}) {
  
  const [companyData, setCompanyData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const { companyName } = useParams();
  const [savedArticles, setSavedArticles] = useState([])

  const {currentUser} = useAuth()
  


  // Similar to the other fetch articles methods in this app, however companyName is used as the query parameter, which is passed down from the routing/link and stored into the variable using useParams
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

  useEffect(() => { // Fetch articles whenever page changes or the user clicks on a Link to other company that changes companyName
    fetchArticles()
  },[page, companyName])

    useEffect(() => {
      setCompanyData([])
      setPage(1)
      setLoading(true)
    }, [companyName])

  function handleScroll() { // When you scroll to the bottom of the page, this function will increment the page state, and consequently the useEffect that fetches articles
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && loading){
      setPage(prevPage => prevPage + 1);
      setLoading(true);
    }
  }

  const debouncedHandleScroll = debounce(handleScroll, 250); // Debounce the handleScroll function to allow time to render and not make unnecessary changes

  useEffect(() => {
    window.addEventListener("scroll", debouncedHandleScroll);

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page]);

  /* 
      Retrieve savedArticles by querying the user property of savedArticles based of current user id. Then get document references for them. For each saved article document the hashedUrl property is used to query documents with the same name. The collection 'hashedToOriginalURLs' contains documents with the hashed URLs of the articles as their name, and a property originalURL which provides the true URL. This is an implementation necessary due to the nature of firestore collection being unable to be stored with special characters. If the originalURL is found which should be the case if toggleSaveArticles() is functioning correctly, then it will push an object/article for each article into the savedArticlesData state containing originalURL and hashedURL.
  */

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

    function generateIdFromUrl(url) { // Utility function for toggleSaveArticles. Replaces special characters with an underscore and then hashes the URL.
      const sanitisedUrl = url.replace(/[/\\.#$]/g, '_')
      return hashCode(sanitisedUrl)
    }

  function hashCode(str) { // Utilty  function for simple hashing of URL. This hash was not made by me. It goes through each character index of the string and shifts the bits to the left by 5, get this resultand subtracts it by the original bit and adds the character code at the end. Overall this function could be any hashing algorithm as long as it prevents collisions when hashing many URLs. Finally it converts this the numerical bits into a String as a hash.
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
    }
    return String(hash)
  }

  /*
      This function is for when a user is interacting with a star image inside the rendered article.  If a user logged in, the function will get the hashed article URL and check if it is in the savedArticles collection. If it exists it will then delete the document from the collection therefore removing it from savedArticles for the user. If it does not exist it will instead save the document with user id, hashed URL and keywords of article title (for fetching the articles through API in SavedArticles page). It will also save the document's hashed URL and original URL inside the collection 'hashedToOriginalURLs'.  Finally it will be added to the savedArticles state array.

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
      <div className="article-container">{/* rendering of articles based on companyData that has been fetched */}
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