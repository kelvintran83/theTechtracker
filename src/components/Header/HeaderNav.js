import React, { useState, useEffect } from "react";
import {debounce} from "lodash";
import {Link, useLocation} from "react-router-dom"
import "./HeaderNav.css";
import { useAuth } from '../../contexts/AuthContexts'
import {db} from "../../firebase"
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'


export default function HeaderNav({formatDescription, apiKey}) {
  const [searchKeywords, setSearchKeywords] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);
  const {currentUser} = useAuth()
  const [savedArticles, setSavedArticles] = useState([])
  const location = useLocation()

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

  // Clear searchResults as to not cause unnecessary API calls, and make the API call with a 300 millisecond debounce delay
  const debouncedAPICall = debounce(searchTerm => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }
  
  const keywordsArray = searchTerm.split(" ").filter(keyword => keyword.trim() !== ""); // Split the search value into substrings through split based on spaces, then filter the words to ensure that none of them are spaces
  const keywordQuery = keywordsArray.join(" OR "); // Append OR for concatenating the query parameter inside the apiURL

  const companyQuery = companyNames.join(" OR "); // Append OR for concatenating the query parameter inside the apiURL

  const apiUrl = `https://newsapi.org/v2/everything?q=${companyQuery} ${keywordQuery}&apiKey=${apiKey}&pageSize=${pageSize}&sortBy=relevancy&language=en`;

  fetch(apiUrl)
      .then(response => response.json())
        .then(data => {
        const filteredArticles = data.articles.filter(article => (
          article.url && article.title && article.author && article.urlToImage && article.publishedAt && article.content
        )); // Filter through each article, the article must contain all relevent properties (no null)
        setSearchResults(filteredArticles);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      })
  }, 300)

  const handleSearch = event => {  // Method gets the value from the input and stores it in searchTerm, which is passed through to the following functions to set state of search keywords and for the API call
    const searchTerm = event.target.value;
    setSearchKeywords(searchTerm);

    debouncedAPICall(searchTerm);
  };

  useEffect(() => { // Every time the searchKeywords state is changed, check to see if searchKeyword state is empty and if so the searchResults state will be set to an empty array to not render articles
    if (searchKeywords.trim() === "") {
      setSearchResults([]);
      return;
    }

  }, [searchKeywords]);



  const handleInputFocus = () => { // Change state of inputFocus , used in onFocus property of input
    setInputFocused(true);
  };

  const handleInputBlur = () => { // Change state of inputFocus , used in onBlur property of input
    setInputFocused(false);
  };

  const style = { // Inline jsx styling to remove default Route styling
    "textDecoration" : "none", "color" : "black"
  }
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
        setSavedArticles(savedArticlesData);
      }
    } catch (error) {
      console.error('Error loading saved articles:', error);
    }
  }

  useEffect(() => { // Should only get saved articles when user logs in/out
    loadSavedArticles();
    
  }, [currentUser]);





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
    <div className="header-nav">
      <div className="nav-section">
        <ul className="company-list"> {/* nav bar with Links to route */}
          
          <Link to="/amazon" style={style}><li>Amazon</li></Link>
          <Link to="/nvidia"style={style}><li> NVIDIA</li></Link>
          <Link to="/google" style={style}><li>Google</li></Link>
          <Link to="/meta" style={style}><li>Meta</li></Link>
          <Link to="/microsoft" style={style}><li>Microsoft</li></Link>
          <Link to="/tesla" style={style}><li>Tesla</li></Link>
          <Link to="/apple" style={style}><li>Apple</li></Link>
        </ul>
        <div className="search-container"> {/* Search input is not to be rendered on login, signup and savedarticles pages */}
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
      <div className="article-container"> {/* rendering of articles based on searchResults state */}
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