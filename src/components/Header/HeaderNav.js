import React, { useState, useEffect } from "react";
import {debounce} from "lodash";
import {Link, useLocation} from "react-router-dom"
import "./HeaderNav.css";
import { useAuth } from '../../contexts/AuthContexts'
import {db} from "../../firebase"
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'


export default function HeaderNav({formatDescription}) {
  const [searchKeywords, setSearchKeywords] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);
  const {currentUser} = useAuth()
  const [savedArticles, setSavedArticles] = useState([])
  const location = useLocation()

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

  }, [searchKeywords]);



  const handleInputFocus = () => {
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  const style = {
    "textDecoration" : "none", "color" : "black"
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
    <div className="header-nav">
      <div className="nav-section">
        <ul className="company-list">
          
          <Link to="/amazon" style={style}><li>Amazon</li></Link>
          <Link to="/nvidia"style={style}><li> NVIDIA</li></Link>
          <Link to="/google" style={style}><li>Google</li></Link>
          <Link to="/meta" style={style}><li>Meta</li></Link>
          <Link to="/microsoft" style={style}><li>Microsoft</li></Link>
          <Link to="/tesla" style={style}><li>Tesla</li></Link>
          <Link to="/apple" style={style}><li>Apple</li></Link>
        </ul>
        <div className="search-container">
          {(location.pathname !== "/login" && location.pathname !== "/signup" && location.pathname !== "/savedarticles") && (
            <input
              className="search"
              type="text"
              value={searchKeywords}
              onChange={handleSearch}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur} 
              placeholder={inputFocused ? "" : "Search trending articles..."}
            />
            )}
        </div>
      </div>
      <div className="article-container">
        {(location.pathname !== "/login" && location.pathname !== "/signup" && location.pathname !== "/savedarticles") &&searchResults.map(article => (
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
      </div>
    </div>
  );
}