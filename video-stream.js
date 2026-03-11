const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');

class VideoStreamManager {
  constructor(io) {
    this.io = io;
    this.streams = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('新的视频流客户端连接');

      socket.on('start-stream', (config) => {
        this.startStream(socket, config);
      });

      socket.on('stop-stream', () => {
        this.stopStream(socket.id);
      });

      socket.on('disconnect', () => {
        this.stopStream(socket.id);
      });

      socket.on('network-status', (status) => {
        this.adjustStreamQuality(socket.id, status);
      });
    });
  }

  startStream(socket, config) {
    const streamId = socket.id;
    
    // 启动FFmpeg进程进行视频处理
    const ffmpegProcess = spawn(ffmpeg, [
      '-f', 'gdigrab', // Windows屏幕捕获
      '-framerate', '30',
      '-i', 'desktop',
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-s', config.resolution || '1280x720',
      '-b:v', config.bitrate || '1000k',
      '-r', '30',
      'pipe:1'
    ]);

    ffmpegProcess.stdout.on('data', (data) => {
      // 通过Socket.io发送视频数据
      socket.emit('video-data', data);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error('FFmpeg错误:', data.toString());
    });

    ffmpegProcess.on('exit', (code) => {
      console.log('FFmpeg进程退出，代码:', code);
      this.streams.delete(streamId);
    });

    this.streams.set(streamId, {
      process: ffmpegProcess,
      config: config
    });

    console.log('视频流已启动:', streamId);
  }

  stopStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.process.kill();
      this.streams.delete(streamId);
      console.log('视频流已停止:', streamId);
    }
  }

  adjustStreamQuality(streamId, networkStatus) {
    const stream = this.streams.get(streamId);
    if (stream) {
      // 根据网络状态调整视频质量
      let newBitrate = '1000k';
      let newResolution = '1280x720';

      if (networkStatus === 'poor') {
        newBitrate = '500k';
        newResolution = '800x600';
      } else if (networkStatus === 'excellent') {
        newBitrate = '2000k';
        newResolution = '1920x1080';
      }

      // 重启FFmpeg进程以应用新的配置
      this.stopStream(streamId);
      const socket = this.io.sockets.sockets.get(streamId);
      if (socket) {
        this.startStream(socket, {
          ...stream.config,
          bitrate: newBitrate,
          resolution: newResolution
        });
      }
    }
  }
}

module.exports = VideoStreamManager;