import { openDB } from "idb";
import { DashboardData, DataFromAPI, Follower, Project, Repo } from "../model";
import { Databases, Entities, Integrations, ObjectStores } from "../enums";
import { SetStateAction } from "react";

const storeAccessToken = async (
  databaseName: string,
  accessToken: string
): Promise<void> => {
  try {
    const db = await openDB(databaseName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ObjectStores.ACCESS_TOKEN_STORE)) {
          db.createObjectStore(ObjectStores.ACCESS_TOKEN_STORE);
        }
      },
    });

    const tx = db.transaction(ObjectStores.ACCESS_TOKEN_STORE, "readwrite");
    const store = tx.objectStore(ObjectStores.ACCESS_TOKEN_STORE);
    await store.put(accessToken, "access_token");

    await tx.done;
    console.log(`Access token stored in ${databaseName}`);
  } catch (error) {
    console.error("Error storing access token:", error);
  }
};

const storeData = async (
  databaseName: string,
  storeName: string,
  data: DataFromAPI
): Promise<void> => {
  try {
    const db = await openDB(databaseName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      },
    });

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    await store.clear();

    for (const obj of data) {
      await store.put(obj);
    }

    await tx.done;
    console.log(`Data stored in ${storeName}`);
  } catch (error) {
    console.error(`Error storing data in ${storeName}`, error);
  }
};

const getGitHubAccessToken = async (
  authorizationCode: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `http://localhost:8080/github/getAccessToken?code=${authorizationCode}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Github access token:", error);
    return null;
  }
};

const getJiraAccessToken = async (
  authorizationCode: string
): Promise<string | null> => {
  try {
    const reqBody = {
      code: authorizationCode,
    };
    const response = await fetch(`http://localhost:8080/jira/getAccessToken`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Jira access token:", error);
    return null;
  }
};

export const getData = async (
  integration: string,
  entity: string,
  accessToken: string
): Promise<DataFromAPI | DashboardData> => {
  try {
    const response = await fetch(
      `http://localhost:8080/${integration}/${entity}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    const data: DataFromAPI | DashboardData = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting data", error);
    return null;
  }
};

export const getAccessTokenFromIndexedDB = async (
  databaseName: string,
  setState?: (data: SetStateAction<string>) => void
): Promise<string> => {
  const dbNames = await indexedDB.databases();
  try {
    const dbExists = dbNames.some((db) => db.name === databaseName);

    if (dbExists) {
      const db = await openDB(databaseName, 1);
      if (db.objectStoreNames.contains(ObjectStores.ACCESS_TOKEN_STORE)) {
        const tx = db.transaction(ObjectStores.ACCESS_TOKEN_STORE, "readonly");
        const store = tx.objectStore(ObjectStores.ACCESS_TOKEN_STORE);
        const storedAccessToken: string = await store.get("access_token");

        if (storedAccessToken) {
          if (setState) {
            setState(storedAccessToken);
          } else {
            return storedAccessToken;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error retrieving access token:", error);
  }
};

const updateDataInBackground = async (): Promise<void> => {
  const githubAccessToken = await getAccessTokenFromIndexedDB(
    Databases.GITHUB_ACCESS_TOKEN
  );

  if (githubAccessToken) {
    getGithubData(githubAccessToken);
  }

  const jiraAccessToken = await getAccessTokenFromIndexedDB(
    Databases.JIRA_ACCESS_TOKEN
  );

  if (jiraAccessToken) {
    getJiraData(jiraAccessToken);
  }
};

const getJiraData = (jiraAT: string) => {
  getData(Integrations.JIRA, Entities.PROJECT, jiraAT).then((data) => {
    storeData(
      Databases.JIRA_PROJECTS,
      ObjectStores.PROJECTS_STORE,
      data as Project[]
    );
  });

  getData(Integrations.JIRA, Entities.DASHBOARD, jiraAT).then((data) => {
    storeData(
      Databases.JIRA_DASHBOARDS,
      ObjectStores.DASHBOARDS_STORE,
      (data as DashboardData).dashboards
    );
  });
};

const getGithubData = (githubAT: string) => {
  getData(Integrations.GITHUB, Entities.REPOS, githubAT).then((data) => {
    storeData(Databases.GITHUB_REPOS, ObjectStores.REPOS_STORE, data as Repo[]);
  });

  getData(Integrations.GITHUB, Entities.FOLLOWERS, githubAT).then((data) => {
    storeData(
      Databases.GITHUB_FOLLOWERS,
      ObjectStores.FOLLOWERS_STORE,
      data as Follower[]
    );
  });
};

updateDataInBackground();

chrome.webNavigation.onCompleted.addListener(({ url }) => {
  if (url.startsWith("http://localhost:8080")) {
    const params = new URLSearchParams(new URL(url).search);
    const authorizationCode = params.get("code");
    const state = params.get("state");

    if (authorizationCode && state) {
      getJiraAccessToken(authorizationCode)
        .then((jiraAccessToken) => {
          if (jiraAccessToken) {
            storeAccessToken(Databases.JIRA_ACCESS_TOKEN, jiraAccessToken);
            getJiraData(jiraAccessToken);
          }
        })
        .catch((error) => {
          console.error("Error getting jira access token:", error);
        });
    } else if (authorizationCode) {
      getGitHubAccessToken(authorizationCode)
        .then((githubAccessToken) => {
          if (githubAccessToken) {
            storeAccessToken(Databases.GITHUB_ACCESS_TOKEN, githubAccessToken);
            getGithubData(githubAccessToken);
          }
        })
        .catch((error) => {
          console.error("Error getting github access token:", error);
        });
    }
  }
});
