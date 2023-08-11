import { openDB } from "idb";
import { Follower, Repo } from "../model";

const storeAccessToken = async (databaseName: string, accessToken: string) => {
  try {
    const db = await openDB(databaseName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("AccessTokenStore")) {
          db.createObjectStore("AccessTokenStore");
        }
      },
    });

    const tx = db.transaction("AccessTokenStore", "readwrite");
    const store = tx.objectStore("AccessTokenStore");
    await store.put(accessToken, "access_token");

    await tx.done;
    console.log("Access token stored in IndexDB.");
  } catch (error) {
    console.error("Error storing access token:", error);
  }
};

const storeData = async (databaseName, storeName, data) => {
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
    console.error("Error exchanging authorization code:", error);
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
    console.error("Error exchanging authorization code:", error);
    return null;
  }
};

export const getGitHubReposFollowers = async (
  entity: string,
  accessToken: string
): Promise<Follower[] | Repo[]> => {
  try {
    const response = await fetch(`http://localhost:8080/github/${entity}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });

    const data: Follower[] | Repo[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting data", error);
    return null;
  }
};

export const getJiraProjectsDashboards = async (
  entity: string,
  accessToken: string
) => {
  try {
    const response = await fetch(`http://localhost:8080/jira/${entity}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });

    const data = await response.json();
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
            storeAccessToken("JiraAccessToken", jiraAccessToken);
            getJiraProjectsDashboards("project", jiraAccessToken).then(
              (data) => {
                storeData("JiraProjects", "ProjectsStore", data);
              }
            );
            getJiraProjectsDashboards("dashboard", jiraAccessToken).then(
              (data) => {
                storeData("JiraDashboards", "DashboardsStore", data.dashboards);
              }
            );
          }
        })
        .catch((error) => {
          console.error("Error getting jira access token:", error);
        });;
    } else if (authorizationCode) {
      getGitHubAccessToken(authorizationCode)
        .then((githubAccessToken) => {
          if (githubAccessToken) {
            storeAccessToken("GitHubAccessToken", githubAccessToken);
            getGitHubReposFollowers("repos", githubAccessToken).then((data) => {
              storeData("GithHubRepos", "ReposStore", data);
            });
            getGitHubReposFollowers("followers", githubAccessToken).then(
              (data) => {
                storeData("GithHubFollowers", "FollowersStore", data);
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
