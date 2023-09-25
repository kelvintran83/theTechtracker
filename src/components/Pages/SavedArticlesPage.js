import React,{useState, useEffect} from "react"
import { useAuth } from '../../contexts/AuthContexts'
import {db} from "../../firebase"
import {doc, setDoc, deleteDoc, getDoc, getDocs,  collection, query, where} from 'firebase/firestore'
import StarIcon from '../../assets/star.svg'
import EmptyStarIcon from '../../assets/star-empty.svg'


export default function SavedArticlesPage({formatDescription, apiKey}) {

  const {currentUser} = useAuth()
  const [savedArticles, setSavedArticles] = useState([])
  const [renderArticles, setRenderArticles] = useState([])

  /*
    This loadSavedArticles function is slightly different from the others used. This is what caused issues when refactoring at the end of the project as the code was not reusable. The main differences is that keywords was that it retrieves the keywords from of a saved article from the firestore db, which is necessary for when making API calls to query to correct article. The for loop syntax is also different which should have been made consistent with the other "loadSavedArticles". This will be revised later after deploying the working version.
  */
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
  // Load saved articles when the page is loaded.
  useEffect(() => {
    loadSavedArticles();
  }, []);


  // A function that fetches the saved articles based on savedArticles keywords and saves them into response. The constant "savedArticleData" uses a promise function to wait until all API queries are completed before continuing. After the array is flattened into the constant "articles" and saved into the renderArticles state.
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
  // Fetches savedArticles to update the renderArticles state each time the savedArticles state changes
  useEffect(() => {
    if (savedArticles.length > 0) {
      fetchSavedArticlesData()
    }
  }, [savedArticles])

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
        ])
      }
    } catch (error) {
      console.error("Error saving article:", error);
    }
  }

  function generateIdFromUrl(url) { // Utility function for toggleSaveArticles. Replaces special characters with an underscore and then hashes the URL.
    const sanitisedUrl = url.replace(/[/\\.#$]/g, '_');
    return hashCode(sanitisedUrl)
  }

  function hashCode(str) { // Utilty  function for simple hashing of URL. This hash was not made by me. It goes through each character index of the string and shifts the bits to the left by 5, get this result and subtracts it by the original bit and adds the character code at the end. Overall this function could be any hashing algorithm as long as it prevents collisions when hashing many URLs. Finally it converts the numerical bits into a String as a hash.
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }
    return String(hash)
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