import type { ServerInfo } from '../types/ServerInfo.js';

export const serverInfo: ServerInfo = {
  name: 'Minecraft Server',
  version: '1.20.1',
  players: {
    online: 42,
    max: 100,
  },
  status: 'online',
  description: 'Welcome to our amazing Minecraft server!',
  ip: 'play.example.com',
  port: 25565,
};

