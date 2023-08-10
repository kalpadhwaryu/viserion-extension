import { IDBPCursorWithValue, openDB } from "idb";
import React, { useState, useEffect, SetStateAction } from "react";
import { Follower, Repo } from "../model";
import { getGitHubReposFollowers } from "../background/background";

const loginWithGitHub = () => {
  chrome.tabs.create({
    url:
      "https://github.com/login/oauth/authorize?client_id=" +
      process.env.REACT_APP_GITHUB_CLIENT_ID,
  });
};

const App = () => {
  const [githubAccessToken, setGithubAccessToken] = useState<string>("");
  const [jiraAccessToken, setJiraAccessToken] = useState<string>("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposFromAPI, setReposFromAPI] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState<boolean>(false);
  const [followers, setFollowers] = useState<Follower[]>([]);

  const fetchGitHubDataFromIndexedDB = async (
    databaseName: string,
    storeName: string,
    setState: (data: SetStateAction<Repo[] | Follower[]>) => void
  ): Promise<void> => {
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

            const data: Follower[] | Repo[] = [];
            cursorReq.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest<IDBPCursorWithValue>)
                .result;
              if (cursor) {
                data.push(cursor.value);
                cursor.continue();
              } else {
                setState(data);
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
      console.error("Error fetching data from IndexedDB:", error);
    }
  };

  const getAccessTokenFromIndexedDB = async () => {
    const dbNames = await indexedDB.databases();
    try {
      const dbExists = dbNames.some((db) => db.name === "GitHubAccessToken");

      if (dbExists) {
        const db = await openDB("GitHubAccessToken", 1);
        if (db.objectStoreNames.contains("AccessTokenStore")) {
          const tx = db.transaction("AccessTokenStore", "readonly");
          const store = tx.objectStore("AccessTokenStore");
          const storedAccessToken: string = await store.get("access_token");

          if (storedAccessToken) {
            setGithubAccessToken(storedAccessToken);
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
  };

  useEffect(() => {
    getAccessTokenFromIndexedDB();
  }, []);

  return (
    <div>
      {githubAccessToken ? (
        <>
          <h3>GitHub Logged in</h3>
          <button
            onClick={() => {
              fetchGitHubDataFromIndexedDB(
                "GithHubRepos",
                "ReposStore",
                setRepos
              );
            }}
          >
            Get your repos from DB
          </button>
          {repos.length > 0 &&
            repos.map((repo) => <h3 key={repo.id}>{repo.name}</h3>)}
          <button
            onClick={async () => {
              setReposLoading(true);
              const repositories = (await getGitHubReposFollowers(
                "repos",
                githubAccessToken
              )) as Repo[];
              setReposFromAPI(repositories);
              setReposLoading(false);
            }}
          >
            Get your repos from API
          </button>
          {reposLoading ? (
            <>Loading...</>
          ) : (
            <>
              {reposFromAPI.length > 0 &&
                reposFromAPI.map((repoFromApi) => (
                  <h3 key={repoFromApi.id}>{repoFromApi.name}</h3>
                ))}
            </>
          )}

          <button
            onClick={() => {
              fetchGitHubDataFromIndexedDB(
                "GithHubFollowers",
                "FollowersStore",
                setFollowers
              );
            }}
          >
            Get your followers from DB
          </button>
          {followers.length > 0 &&
            followers.map((follower) => (
              <h3 key={follower.id}>{follower.login}</h3>
            ))}
        </>
      ) : (
        <button onClick={loginWithGitHub}>Login With GitHub</button>
      )}
      {jiraAccessToken ? (
        <>
          <h3>Jira Logged in</h3>
        </>
      ) : (
        <button>Login With Jira</button>
      )}
    </div>
  );
};

export default App;
