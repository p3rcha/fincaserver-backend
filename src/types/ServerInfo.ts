export interface ServerInfo {
  name: string;
  version: string;
  players: {
    online: number;
    max: number;
  };
  status: 'online' | 'offline';
  description?: string;
  ip?: string;
  port?: number;
}

