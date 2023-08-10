import { openDB } from "idb";
import React, { useState, useEffect } from "react";

const loginWithGitHub = () => {
  chrome.tabs.create({
    url:
      "https://github.com/login/oauth/authorize?client_id=" +
      process.env.REACT_APP_GITHUB_CLIENT_ID,
  });
};

const App = () => {
  const [githubAccessToekn, setGithubAccessToekn] = useState("");

  useEffect(() => {
    async function getAccessTokenFromIndexedDB() {
      try {
        const dbNames = await indexedDB.databases();
        const dbExists = dbNames.some((db) => db.name === "GitHubAccessToken");

        if (dbExists) {
          const db = await openDB("GitHubAccessToken", 1);
          if (db.objectStoreNames.contains("AccessTokenStore")) {
            const tx = db.transaction("AccessTokenStore", "readonly");
            const store = tx.objectStore("AccessTokenStore");
            const storedAccessToken = await store.get("access_token");

            if (storedAccessToken) {
              setGithubAccessToekn(storedAccessToken);
              console.log(
                "Access token retrieved from IndexedDB:",
                storedAccessToken
              );
            } else {
              console.log("Access token not found in IndexedDB.");
            }
          } else {
            console.log("AccessTokenStore object store not found.");
          }
        } else {
          console.log("GitHubAccessToken database not found.");
        }
      } catch (error) {
        console.error("Error retrieving access token:", error);
      }
    }

    getAccessTokenFromIndexedDB(); // Call the function when the component mounts
  }, []);

  return (
    <div>
      {githubAccessToekn ? (
        <>
          <h1>GitHub Logged in</h1>
          <button>Get your repos</button>
        </>
      ) : (
        <button onClick={loginWithGitHub}>Login With GitHub</button>
      )}
    </div>
  );
};

export default App;
