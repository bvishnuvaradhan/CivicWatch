export interface Worker {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  isAvailable: boolean;
  available?: boolean;
  activeIssueCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  reputationPoints: number;
  isBlocked: boolean;
  avatarUrl?: string;
  bio?: string;
  joinedAt: string;
  _count?: {
    issues: number;
    votes: number;
    comments: number;
  };
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
  reviewPhotoUrl?: string;
  reviewNotes?: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  voteCount?: number;
  commentCount?: number;
  createdById: string;
  createdBy?: User;
  assignedWorker?: Worker;
  _count?: {
    votes: number;
    comments: number;
    flags: number;
  };
  timeline?: {
    status: string;
    description: string;
    timestamp: string;
  }[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  createdAtEpochMs?: number;
  link?: string;
}

export interface Comment {
  id: string;
  text: string;
  issueId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface Vote {
  id: string;
  issueId: string;
  userId: string;
  type: 'UP' | 'DOWN';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string;
  reputationPoints: number;
  reportsCount: number;
}
