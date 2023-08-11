import { IDBPCursorWithValue, openDB } from "idb";
import React, { useState, useEffect, SetStateAction } from "react";
import { DataFromAPI, Follower, Project, Repo } from "../model";
import { getData } from "../background/background";
import { Databases, Entities, Integrations, ObjectStores } from "../enums";

const login = (integration: string) => {
  chrome.tabs.create({
    url:
      integration === Integrations.GITHUB
        ? "https://github.com/login/oauth/authorize?client_id=" +
          process.env.REACT_APP_GITHUB_CLIENT_ID
        : "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=" +
          process.env.REACT_APP_JIRA_CLIENT_ID +
          "&scope=" +
          process.env.REACT_APP_JIRA_SCOPE +
          "&redirect_uri=http%3A%2F%2Flocalhost%3A8080&state=$" +
          process.env.REACT_APP_JIRA_STATE +
          "&response_type=code&prompt=consent",
  });
};

const App = () => {
  const [githubAccessToken, setGithubAccessToken] = useState<string>("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposFromAPI, setReposFromAPI] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState<boolean>(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [followersFromAPI, setFollowersFromAPI] = useState<Follower[]>([]);
  const [followersLoading, setFollowersLoading] = useState<boolean>(false);

  const [jiraAccessToken, setJiraAccessToken] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchDataFromIndexedDB = async (
    databaseName: string,
    storeName: string,
    setState: (data: SetStateAction<DataFromAPI>) => void
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

  const getAccessTokenFromIndexedDB = async (
    databaseName: string,
    setState: (data: SetStateAction<string>) => void
  ) => {
    const dbNames = await indexedDB.databases();
    try {
      const dbExists = dbNames.some((db) => db.name === databaseName);

      if (dbExists) {
        const db = await openDB(databaseName, 1);
        if (db.objectStoreNames.contains(ObjectStores.ACCESS_TOKEN_STORE)) {
          const tx = db.transaction(
            ObjectStores.ACCESS_TOKEN_STORE,
            "readonly"
          );
          const store = tx.objectStore(ObjectStores.ACCESS_TOKEN_STORE);
          const storedAccessToken: string = await store.get("access_token");

          if (storedAccessToken) {
            setState(storedAccessToken);
          } else {
            console.log("Access token not found in IndexedDB.");
          }
        } else {
          console.log("AccessTokenStore object store not found.");
        }
      } else {
        console.log(`${databaseName} database not found.`);
      }
    } catch (error) {
      console.error("Error retrieving access token:", error);
    }
  };

  useEffect(() => {
    getAccessTokenFromIndexedDB(
      Databases.GITHUB_ACCESS_TOKEN,
      setGithubAccessToken
    );
    getAccessTokenFromIndexedDB(
      Databases.JIRA_ACCESS_TOKEN,
      setJiraAccessToken
    );
  }, []);

  return (
    <div>
      {githubAccessToken ? (
        <>
          <h3>GitHub Logged in</h3>
          <button
            onClick={() => {
              fetchDataFromIndexedDB(
                Databases.GITHUB_REPOS,
                ObjectStores.REPOS_STORE,
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
              const repositories = (await getData(
                Integrations.GITHUB,
                Entities.REPOS,
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
              fetchDataFromIndexedDB(
                Databases.GITHUB_FOLLOWERS,
                ObjectStores.FOLLOWERS_STORE,
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

          <button
            onClick={async () => {
              setFollowersLoading(true);
              const githubFollowers = (await getData(
                Integrations.GITHUB,
                Entities.FOLLOWERS,
                githubAccessToken
              )) as Follower[];
              setFollowersFromAPI(githubFollowers);
              setFollowersLoading(false);
            }}
          >
            Get your followers from API
          </button>
          {followersLoading ? (
            <>Loading...</>
          ) : (
            <>
              {followersFromAPI.length > 0 &&
                followersFromAPI.map((followerFromApi) => (
                  <h3 key={followerFromApi.id}>{followerFromApi.login}</h3>
                ))}
            </>
          )}
        </>
      ) : (
        <button onClick={() => login(Integrations.GITHUB)}>
          Login With GitHub
        </button>
      )}

      {jiraAccessToken ? (
        <>
          <h3>Jira Logged in</h3>
          <button
            onClick={() => {
              fetchDataFromIndexedDB(
                Databases.JIRA_PROJECTS,
                ObjectStores.PROJECTS_STORE,
                setProjects
              );
            }}
          >
            Get your projects from DB
          </button>
          {projects.length > 0 &&
            projects.map((project) => <h3 key={project.id}>{project.name}</h3>)}
        </>
      ) : (
        <button onClick={() => login(Integrations.JIRA)}>
          Login With Jira
        </button>
      )}
    </div>
  );
};

export default App;
