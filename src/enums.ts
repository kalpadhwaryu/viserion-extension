export enum Integrations {
  GITHUB = "github",
  JIRA = "jira",
}

export enum ObjectStores {
  ACCESS_TOKEN_STORE = "AccessTokenStore",
  REPOS_STORE = "ReposStore",
  FOLLOWERS_STORE = "FollowersStore",
  PROJECTS_STORE = "ProjectsStore",
  DASHBOARDS_STORE = "DashboardsStore",
}

export enum Databases {
  GITHUB_ACCESS_TOKEN = "GitHubAccessToken",
  GITHUB_REPOS = "GithHubRepos",
  GITHUB_FOLLOWERS = "GithHubFollowers",
  JIRA_ACCESS_TOKEN = "JiraAccessToken",
  JIRA_PROJECTS = "JiraProjects",
  JIRA_DASHBOARDS = "JiraDashboards",
}

export enum Entities {
  REPOS = "repos",
  FOLLOWERS = "followers",
  PROJECT = "project",
  DASHBOARD = "dashboard",
}
