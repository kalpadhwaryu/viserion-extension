export interface Repo {
  id: string;
  name: string;
}
export interface Follower {
  id: string;
  login: string;
}

export type Project = Repo;
export type Dashboard = Repo;

export interface DashboardData {
  dashboards: Dashboard[];
}

export type DataFromAPI = (Repo | Project | Follower | Dashboard)[];
