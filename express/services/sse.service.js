class SSEService {
  constructor() {
    this.clients = new Map();
    this.connectionId = 0;
  }

  addClient(res, options = {}) {
    const id = ++this.connectionId;
    const clientId = `client_${id}_${Date.now()}`;
    
    const clientInfo = {
      id: clientId,
      res,
      options,
      connectedAt: new Date(),
      lastPingAt: new Date()
    };
    
    this.clients.set(clientId, clientInfo);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId, timestamp: new Date().toISOString() })}\n\n`);
    
    res.on('close', () => {
      console.log(`SSE 客户端断开：${clientId}`);
      this.removeClient(clientId);
    });
    
    res.on('error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`SSE 客户端错误：${clientId}`, error.message);
      }
      this.removeClient(clientId);
    });
    
    console.log(`SSE 客户端已连接，当前连接数：${this.clients.size}`);
    
    return clientId;
  }

  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      if (client.pingInterval) {
        clearInterval(client.pingInterval);
      }
      this.clients.delete(clientId);
      if (process.env.NODE_ENV === 'development') {
        console.log(`客户端已移除：${clientId}, 剩余连接数：${this.clients.size}`);
      }
    }
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && !client.res.writableEnded) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        client.lastPingAt = new Date();
        return true;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`发送消息失败：${clientId}`, error.message);
        }
        this.removeClient(clientId);
        return false;
      }
    }
    return false;
  }

  broadcast(data, filterFn = null) {
    let count = 0;
    this.clients.forEach((client, clientId) => {
      if (!filterFn || filterFn(client)) {
        if (this.sendToClient(clientId, data)) {
          count++;
        }
      }
    });
    console.log(`广播消息，成功发送到 ${count} 个客户端`);
    return count;
  }

  sendHeartbeat(clientId) {
    return this.sendToClient(clientId, {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    });
  }

  startHeartbeat(clientId, interval = 30000) {
    const client = this.clients.get(clientId);
    if (client && !client.pingInterval) {
      client.pingInterval = setInterval(() => {
        this.sendHeartbeat(clientId);
      }, interval);
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  getClientInfo(clientId) {
    return this.clients.get(clientId);
  }

  getAllClients() {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      connectedAt: client.connectedAt,
      lastPingAt: client.lastPingAt,
      options: client.options
    }));
  }

  closeAll() {
    this.clients.forEach((client, clientId) => {
      if (client.pingInterval) {
        clearInterval(client.pingInterval);
      }
      if (!client.res.writableEnded) {
        client.res.end();
      }
    });
    this.clients.clear();
    console.log('所有 SSE 连接已关闭');
  }
}

module.exports = new SSEService();
