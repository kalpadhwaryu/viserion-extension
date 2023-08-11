import { openDB } from "idb";
import { DashboardData, DataFromAPI, Follower, Project, Repo } from "../model";
import { Databases, Entities, Integrations, ObjectStores } from "../enums";

const storeAccessToken = async (databaseName: string, accessToken: string) => {
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
    console.log("Access token stored in IndexDB.");
  } catch (error) {
    console.error("Error storing access token:", error);
  }
};

const storeData = async (
  databaseName: string,
  storeName: string,
  data: DataFromAPI
) => {
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

    for (const obj of data) {
      await store.put(obj);
    }

    await tx.done;
    console.log(`${storeName} stored in IndexedDB.`);
  } catch (error) {
    console.error(`Error storing ${storeName} in IndexedDB:`, error);
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
    console.error("Error getting access token:", error);
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
    console.error("Error getting access token:", error);
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
            getData(Integrations.JIRA, Entities.PROJECT, jiraAccessToken).then(
              (data) => {
                storeData(
                  Databases.JIRA_PROJECTS,
                  ObjectStores.PROJECTS_STORE,
                  data as Project[]
                );
              }
            );
            getData(
              Integrations.JIRA,
              Entities.DASHBOARD,
              jiraAccessToken
            ).then((data) => {
              storeData(
                Databases.JIRA_DASHBOARDS,
                ObjectStores.DASHBOARDS_STORE,
                (data as DashboardData).dashboards
              );
            });
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
            getData(
              Integrations.GITHUB,
              Entities.REPOS,
              githubAccessToken
            ).then((data) => {
              storeData(
                Databases.GITHUB_REPOS,
                ObjectStores.REPOS_STORE,
                data as Repo[]
              );
            });
            getData(Integrations.GITHUB, "followers", githubAccessToken).then(
              (data) => {
                storeData(
                  Databases.GITHUB_FOLLOWERS,
                  ObjectStores.FOLLOWERS_STORE,
                  data as Follower[]
                );
              }
            );
          }
        })
        .catch((error) => {
          console.error("Error getting github access token:", error);
        });
    }
  }
});
