import { IDBPCursorWithValue, openDB } from "idb";
import React, { useState, useEffect } from "react";

const loginWithGitHub = () => {
  chrome.tabs.create({
    url:
      "https://github.com/login/oauth/authorize?client_id=" +
      process.env.REACT_APP_GITHUB_CLIENT_ID,
  });
};

const App = () => {
  const [githubAccessToken, setGithubAccessToken] = useState("");
  const [repos, setRepos] = useState([]);
  const [followers, setFollowers] = useState([]);

  async function fetchReposFromIndexedDB() {
    const databaseName = "GithHubRepos";
    const storeName = "ReposStore";

    try {
      const dbNames = await indexedDB.databases();
      const dbExists = dbNames.some((db) => db.name === databaseName);

      if (dbExists) {
        const openReq = indexedDB.open(databaseName, 1);

        openReq.onsuccess = () => {
          const db = openReq.result;
          if (db.objectStoreNames.contains(storeName)) {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const cursorReq = store.openCursor();

            const reposData = [];
            cursorReq.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest<IDBPCursorWithValue>)
                .result;
              if (cursor) {
                reposData.push(cursor.value);
                cursor.continue();
              } else {
                setRepos(reposData);
              }
            };
          } else {
            console.log(`${storeName} object store not found.`);
          }
        };
      } else {
        console.log(`${databaseName} database not found.`);
      }
    } catch (error) {
      console.error("Error fetching repositories from IndexedDB:", error);
    }
  }

  async function fetchFollowersFromIndexedDB() {
    const databaseName = "GithHubFollowers";
    const storeName = "FollowersStore";

    try {
      const dbNames = await indexedDB.databases();
      const dbExists = dbNames.some((db) => db.name === databaseName);

      if (dbExists) {
        const openReq = indexedDB.open(databaseName, 1);

        openReq.onsuccess = () => {
          const db = openReq.result;
          if (db.objectStoreNames.contains(storeName)) {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const cursorReq = store.openCursor();

            const followersData = [];
            cursorReq.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest<IDBPCursorWithValue>)
                .result;
              if (cursor) {
                followersData.push(cursor.value);
                cursor.continue();
              } else {
                setFollowers(followersData);
              }
            };
          } else {
            console.log(`${storeName} object store not found.`);
          }
        };
      } else {
        console.log(`${databaseName} database not found.`);
      }
    } catch (error) {
      console.error("Error fetching repositories from IndexedDB:", error);
    }
  }

  useEffect(() => {
    async function getAccessTokenFromIndexedDB() {
      const dbNames = await indexedDB.databases();
      try {
        const dbExists = dbNames.some((db) => db.name === "GitHubAccessToken");

        if (dbExists) {
          const db = await openDB("GitHubAccessToken", 1);
          if (db.objectStoreNames.contains("AccessTokenStore")) {
            const tx = db.transaction("AccessTokenStore", "readonly");
            const store = tx.objectStore("AccessTokenStore");
            const storedAccessToken = await store.get("access_token");

            if (storedAccessToken) {
              setGithubAccessToken(storedAccessToken);
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

    getAccessTokenFromIndexedDB();
  }, []);

  return (
    <div>
      {githubAccessToken ? (
        <>
          <h3>GitHub Logged in</h3>
          <button onClick={fetchReposFromIndexedDB}>Get your repos</button>
          {repos.length > 0 &&
            repos.map((repo) => <h3 key={repo.id}>{repo.name}</h3>)}
          <button onClick={fetchFollowersFromIndexedDB}>
            Get your followers
          </button>
          {followers.length > 0 &&
            followers.map((follower) => (
              <h3 key={follower.id}>{follower.login}</h3>
            ))}
        </>
      ) : (
        <button onClick={loginWithGitHub}>Login With GitHub</button>
      )}
    </div>
  );
};

export default App;
