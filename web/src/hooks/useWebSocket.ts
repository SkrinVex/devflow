import { useEffect } from 'react';
import type { WebSocketEvent } from '../types';

interface UseWebSocketOptions {
  isAuthenticated: boolean;
  onEvent: (event: WebSocketEvent) => void;
}

export const useWebSocket = ({ isAuthenticated, onEvent }: UseWebSocketOptions) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('devflow_token');
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isSubscribed = true;

    const connect = () => {
      if (!isSubscribed) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws?token=${encodeURIComponent(token)}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // Connected
        };

        ws.onmessage = (e) => {
          try {
            const data: WebSocketEvent = JSON.parse(e.data);
            if (data && data.type && data.type !== 'connected') {
              onEvent(data);
            }
          } catch {
            // ignore non-json keepalives
          }
        };

        ws.onclose = () => {
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        if (isSubscribed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [isAuthenticated, onEvent]);
};
