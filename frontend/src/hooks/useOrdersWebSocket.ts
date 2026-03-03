import { useEffect, useRef, useCallback } from "react";

type MessageHandler = (data: { type: string; invoice_id?: string; status?: string }) => void;

export function useOrdersWebSocket(onMessage: MessageHandler) {
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const rawBase = import.meta.env.VITE_API_BASE_URL || "https://amabakerypos-production.up.railway.app/";
    const httpStripped = rawBase.replace(/\/+$/, "");
    const wsBase = httpStripped.replace(/^http/, "ws");
    const socket = new WebSocket(wsBase + "/ws/orders/");

    socket.onopen = () => {
      console.log("[WS] Orders socket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // Ignore malformed messages
      }
    };

    socket.onclose = () => {
      console.log("[WS] Orders socket closed, reconnecting in 3s...");
      setTimeout(connect, 3000);
    };

    socket.onerror = () => {
      socket.close();
    };

    socketRef.current = socket;
  }, [onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return socketRef;
}
