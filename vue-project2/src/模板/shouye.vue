<template>
    <!-- 紧凑的数据概览区域 -->
    <div class="data-overview compact">
      <div class="overview-header">
        <h3>巡检中心</h3>
      </div>
      
      <!-- 环境数据 -->
      <div class="data-section compact">
        <h4>环境监测</h4>
        <div class="environment-grid compact">
          <div class="env-item">
            <div class="env-label">温度</div>
            <div class="env-value">{{ environmentData.temperature }}°C</div>
          </div>
          <div class="env-item">
            <div class="env-label">湿度</div>
            <div class="env-value">{{ environmentData.humidity }}%</div>
          </div>
          <div class="env-item">
            <div class="env-label">气体浓度</div>
            <div class="env-value">{{ environmentData.gas }}ppm</div>
          </div>
          <div class="env-item">
            <div class="env-label">易燃气体（ VOC<sub>s</sub> ）</div>
            <div class="env-value">{{ environmentData.pm25 }}μg/m³</div>
          </div>
        </div>
      </div>

      <!-- 设备统计 -->
      <div class="data-section compact">
        <h4>设备统计</h4>
        <div class="stats-grid compact">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="icon">🤖</i>
            </div>
            <div class="stat-info">
              <h3>机器人总数</h3>
              <p class="stat-number">{{ robotStats.total }}</p>
              <p class="stat-change positive">+{{ robotStats.change }} 本月</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="icon">🔋</i>
            </div>
            <div class="stat-info">
              <h3>低电量设备数</h3>
              <p class="stat-number">{{ robotStats.lowBatteryCount }}</p>
              <p class="stat-change negative">电量低于20%</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="icon">⚠️</i>
            </div>
            <div class="stat-info">
              <h3>当前预警设备数量</h3>
              <p class="stat-number">{{ alertStats.current }}</p>
              <p class="stat-change negative">实时</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon bg-danger">
              <i class="icon">🌐</i>
            </div>
            <div class="stat-info">
              <h3>离线设备数</h3>
              <p class="stat-number">{{ robotStats.offline }}</p>
              <p class="stat-change negative">{{ robotStats.offlineChange }} 当前</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 其他内容区域保持不变 -->
    <div class="content-grid">
      <!-- 左侧：数字孪生地图和机器人位置 -->
      <div class="map-section card">
        <h3>数字孪生地图</h3>
        <div class="map-container">
          <!-- 地图背景 -->
          <div class="map-background">
            <div class="facility-layout">
              <div class="building">A栋</div>
              <div class="building">B栋</div>
              <div class="corridor">走廊</div>
            </div>
            
            <!-- AMG8833热力图 -->
            <div class="heatmap-overlay" v-if="showThermalOverlay">
              <!-- 热力图网格 -->
              <div 
                v-for="(row, rowIndex) in thermalGrid" 
                :key="'thermal-row-' + rowIndex"
                :style="{ display: 'grid', gridTemplateColumns: `repeat(${thermalGrid[0].length}, 1fr)`, height: `${100 / thermalGrid.length}%` }"
              >
                <div 
                  v-for="(temp, colIndex) in row"
                  :key="'thermal-cell-' + rowIndex + '-' + colIndex"
                  :style="{ 
                    backgroundColor: getThermalColor(temp),
                    opacity: getOpacityByTemp(temp)
                  }"
                  class="thermal-cell"
                ></div>
              </div>
            </div>
            
            <!-- 旧版热力点（可选显示） -->
            <div class="heatmap-overlay-old" v-if="!showThermalOverlay">
              <div 
                class="heat-point"
                v-for="(heatPoint, index) in heatPoints" 
                :key="'heat-'+index"
                :style="{ 
                  left: heatPoint.x + 'px', 
                  top: heatPoint.y + 'px',
                  backgroundColor: getHeatmapColor(heatPoint.temp),
                  width: heatPoint.radius + 'px',
                  height: heatPoint.radius + 'px'
                }"
              ></div>
            </div>
            
            <!-- 机器人位置 -->
            <div 
              class="robot-position"
              v-for="(robot, index) in robots"
              :key="index"
              :style="{ left: robot.x + 'px', top: robot.y + 'px' }"
            >
              <div class="robot-icon" :class="{ moving: robot.moving }">
                <i class="icon">🤖</i>
              </div>
              <div class="robot-info">
                <div class="robot-id">#{{ robot.id }}</div>
                <div class="robot-battery">电量: {{ robot.battery }}%</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 控制面板 -->
        <div class="control-panel">
          <label>
            <input type="checkbox" v-model="showThermalOverlay" /> 显示AMG8833热力图
          </label>
          <button @click="toggleGridSize" class="btn btn-secondary">
            切换分辨率 ({{thermalGrid[0].length}}x{{thermalGrid.length}})
          </button>
        </div>
      </div>
      
      <!-- 右侧：视频流和控制台 -->
      <div class="right-panel">
        <!-- 视频流 -->
        <div class="video-section card">
          <h3>实时视频流</h3>
          <div class="video-container">
            <div class="video-placeholder">
              <p>机器人摄像头实时画面</p>
              <div class="video-stream" v-if="videoStreamActive">
                <img :src="currentVideoFrame" alt="实时视频流" />
              </div>
              <div class="no-video" v-else>
                <p>等待视频流连接...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 控制台 -->
        <div class="activity-section card">
          <h3>控制台</h3>
          <ul class="activity-list">
            <li class="activity-item" v-for="(log, index) in mergedActivityLogs" :key="index" @click="scrollToMap">
              <div class="activity-icon">{{ log.icon }}</div>
              <div class="activity-content">
                <h4>{{ log.title }}</h4>
                <p v-html="formatLogMessage(log.message)"></p>
                <span class="activity-time">{{ log.time }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

// AMG8833 8x8 原始温度数据（最新数据）
const original_8x8 = [
  [16.8, 17.8, 18.2, 17.8, 16.8, 17.0, 14.0, 11.8],
  [17.0, 17.8, 18.2, 17.5, 18.5, 18.5, 17.5, 14.8],
  [16.0, 17.5, 17.8, 18.2, 18.0, 18.8, 19.2, 17.8],
  [16.8, 17.2, 17.8, 18.5, 18.8, 19.0, 18.2, 17.2],
  [16.5, 16.5, 16.8, 18.2, 19.2, 19.0, 18.0, 18.2],
  [15.2, 17.0, 16.8, 17.0, 18.8, 18.0, 18.2, 17.2],
  [14.2, 15.5, 15.5, 17.0, 17.5, 17.0, 15.2, 16.8],
  [13.2, 13.0, 12.8, 13.0, 15.0, 16.0, 14.2, 7.8]
];

// 32x32 插值温度数据（基于最新数据生成）
const heatData32x32 = [
  [16.8, 17.08, 17.35, 17.58, 17.74, 17.8, 17.74, 17.54, 17.19, 16.71, 16.15, 15.57, 15.04, 14.62, 14.36, 14.29, 14.41, 14.69, 15.08, 15.52, 15.94, 16.29, 16.53, 16.64, 16.63, 16.52, 16.34, 16.12, 15.9, 15.71, 15.58, 15.52],
  // ... 省略中间数据以保持简洁
  [23.31, 22.67, 22.01, 21.57, 21.32, 21.06, 21.23, 21.65, 22.21, 22.68, 23.04, 23.41, 23.79, 23.93, 24.0, 24.03, 24.34, 24.65, 24.68, 24.68, 24.38, 24.23, 24.23, 24.23, 24.19, 24.28, 24.63, 24.87, 24.95, 24.99, 24.84, 24.74]
];

// 机器人统计数据
const robotStats = ref({
  total: 12,
  change: 2,
  lowBatteryCount: 3, // 改为低电量设备数
  offline: 1, // 改为离线设备数
  offlineChange: '-1' // 离线设备变化
});

// 预警统计数据
const alertStats = ref({
  current: 3, // 改为当前预警设备数量
  week: 12
});

// 环境数据
const environmentData = ref({
  temperature: 23.5,
  humidity: 65,
  gas: 45,
  pm25: 28
});

// 机器人位置数据
const robots = ref([
  { id: 'R001', x: 150, y: 120, battery: 85, moving: true },
  { id: 'R002', x: 280, y: 200, battery: 62, moving: false },
  { id: 'R003', x: 420, y: 100, battery: 95, moving: true }
]);

// 热力点数据（用于旧版热力图）
const heatPoints = ref([
  { x: 100, y: 80, temp: 20, radius: 30 },
  { x: 200, y: 150, temp: 32, radius: 25 },
  { x: 350, y: 180, temp: 42, radius: 40 },
  { x: 450, y: 90, temp: 28, radius: 20 },
  { x: 280, y: 250, temp: 48, radius: 45 }
]);

// 新增：AMG8833热成像数据相关
const showThermalOverlay = ref(true);  // 是否显示热力图叠加层
const gridSize = ref(32);  // 默认32x32网格
let thermalGrid = ref(heatData32x32);  // 当前热成像网格数据

// 视频流数据
const videoStreamActive = ref(true);
const currentVideoFrame = ref(''); // 实际应用中会是视频帧的URL或base64数据

// 活动日志
const activityLogs = ref([
  { icon: '🔋', title: '电量提醒', message: '机器人 #R002 电量低于20%', time: '2分钟前' },
  { icon: '🔋', title: '电量提醒', message: '机器人 #R004 电量低于15%', time: '5分钟前' },
  { icon: '⚠️', title: '预警信息', message: 'B栋检测到温度异常', time: '5分钟前' },
  { icon: '⚠️', title: '预警信息', message: 'A栋检测到烟雾浓度过高', time: '8分钟前' },
  { icon: '📍', title: '位置更新', message: '机器人 #R001 到达A栋大厅', time: '8分钟前' },
  { icon: '📍', title: '位置更新', message: '机器人 #R003 到达B栋走廊', time: '10分钟前' },
  { icon: '✅', title: '任务完成', message: '机器人 #R002 完成巡检任务', time: '15分钟前' },
  { icon: '✅', title: '任务完成', message: '机器人 #R005 完成夜间巡检', time: '20分钟前' }
]);

// 计算属性：合并相同title的活动日志
const mergedActivityLogs = computed(() => {
  const merged = {};
  
  activityLogs.value.forEach(log => {
    if (!merged[log.title]) {
      merged[log.title] = {
        icon: log.icon,
        title: log.title,
        messages: [],
        latestTime: log.time
      };
    }
    
    // 添加消息
    merged[log.title].messages.push(log.message);
    
    // 更新最新时间
    if (new Date(log.time) > new Date(merged[log.title].latestTime)) {
      merged[log.title].latestTime = log.time;
    }
  });
  
  // 转换为数组并按时间排序
  return Object.values(merged)
    .map(item => ({
      icon: item.icon,
      title: item.title,
      message: item.messages, // 保持为数组格式
      time: item.latestTime
    }))
    .sort((a, b) => new Date(b.time) - new Date(a.time));
});

// 格式化日志消息，将数组转换为分行显示
const formatLogMessage = (messages) => {
  if (Array.isArray(messages)) {
    return messages.join('<br>');
  }
  return messages;
};

const scrollToMap = () => {
  const mapSection = document.querySelector('.map-section');
  mapSection.scrollIntoView({ behavior: 'smooth' });
};

const getHeatmapColor = (temperature) => {
  // 根据温度值返回不同的颜色，符合风险热力图颜色编码规范
  if (temperature < 20) return 'rgba(33, 150, 243, 0.6)'; // 蓝色 - 低温
  if (temperature <= 30) return 'rgba(33, 150, 243, 0.8)'; // 浅蓝
  if (temperature <= 35) return 'rgba(255, 193, 7, 0.6)'; // 黄色 - 中温
  if (temperature <= 40) return 'rgba(255, 152, 0, 0.7)'; // 橙色
  return 'rgba(244, 67, 54, 0.6)'; // 红色 - 高温
};

// 新增：根据温度值获取热力图颜色（蓝-黄-红）
const getThermalColor = (temp) => {
  // 根据温度值返回对应的颜色，使用蓝-黄-红渐变
  const minTemp = 7.8; // 最低温度（根据最新数据调整）
  const maxTemp = 24.68; // 最高温度（根据最新数据调整）
  const ratio = Math.min(Math.max((temp - minTemp) / (maxTemp - minTemp), 0), 1);

  let r, g, b;
  if (ratio < 0.5) {
    // 从蓝色到黄色 (0.0 to 0.5)
    const t = ratio * 2;
    r = Math.floor(255 * t);
    g = Math.floor(255 * Math.min(t * 2, 1));
    b = Math.floor(255 * (1 - t));
  } else {
    // 从黄色到红色 (0.5 to 1.0)
    const t = (ratio - 0.5) * 2;
    r = 255;
    g = Math.floor(255 * (1 - t));
    b = 0;
  }

  return `rgb(${r}, ${g}, ${b})`;
};

// 新增：根据温度值计算透明度
const getOpacityByTemp = (temp) => {
  // 温度越高，透明度越低（更明显）
  const minTemp = 7.8; // 最低温度
  const maxTemp = 24.68; // 最高温度
  const ratio = Math.min(Math.max((temp - minTemp) / (maxTemp - minTemp), 0), 1);
  return 0.3 + ratio * 0.7; // 0.3 to 1.0
};

// 新增：切换网格大小
const toggleGridSize = () => {
  if (gridSize.value === 32) {
    gridSize.value = 8;
    thermalGrid.value = original_8x8;
  } else {
    gridSize.value = 32;
    thermalGrid.value = heatData32x32;
  }
};

// SSE连接
let eventSource = null;

// 初始化SSE连接
const initSSEConnection = () => {
  if (eventSource) {
    eventSource.close();
  }

  // 创建SSE连接，使用/api前缀以确保通过代理转发到后端
  eventSource = new EventSource('/api/battery-summary');

  // 监听消息事件
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      updateDashboardData(data);
    } catch (error) {
      console.error('解析SSE数据失败:', error);
    }
  };

  // 监听错误事件
  eventSource.onerror = (error) => {
    console.error('SSE连接错误:', error);
    // 尝试重新连接
    eventSource.close();
    setTimeout(initSSEConnection, 5000);
  };

  // 监听连接打开事件
  eventSource.onopen = () => {
    console.log('SSE连接已建立');
  };
};

// 更新仪表板数据
const updateDashboardData = (data) => {
  // 更新机器人统计数据
  if (data.robotStats) {
    robotStats.value = {
      total: data.robotStats.total || robotStats.value.total,
      change: data.robotStats.change || robotStats.value.change,
      lowBatteryCount: data.robotStats.lowBatteryCount || 0,
      offline: data.robotStats.offline || 0,
      offlineChange: data.robotStats.offlineChange || robotStats.value.offlineChange
    };
  }

  // 更新预警统计数据
  if (data.alertStats) {
    alertStats.value = {
      current: data.alertStats.current || 0,
      week: data.alertStats.week || alertStats.value.week
    };
  }

  // 更新环境数据
  if (data.environment) {
    environmentData.value = {
      temperature: data.environment.temperature || environmentData.value.temperature,
      humidity: data.environment.humidity || environmentData.value.humidity,
      gas: data.environment.gas || environmentData.value.gas,
      pm25: data.environment.pm25 || environmentData.value.pm25
    };
  }

  // 更新机器人位置
  if (data.robots && Array.isArray(data.robots)) {
    robots.value = data.robots.map(robot => ({
      id: robot.id,
      x: robot.x || Math.random() * 400 + 50,
      y: robot.y || Math.random() * 300 + 50,
      battery: robot.battery || Math.floor(Math.random() * 100),
      moving: robot.moving || Math.random() > 0.5
    }));
  }

  // 更新热力点数据
  if (data.heatPoints && Array.isArray(data.heatPoints)) {
    heatPoints.value = data.heatPoints.map(point => ({
      x: point.x || Math.random() * 500,
      y: point.y || Math.random() * 350,
      temp: point.temp || Math.random() * 30 + 10,
      radius: point.radius || Math.random() * 30 + 10
    }));
  }

  // 更新活动日志
  if (data.activityLogs && Array.isArray(data.activityLogs)) {
    // 只保留最新的10条日志
    const newLogs = data.activityLogs.slice(0, 10);
    
    // 如果日志内容有变化，才更新
    if (JSON.stringify(activityLogs.value) !== JSON.stringify(newLogs)) {
      activityLogs.value = newLogs;
    }
  }

  // 更新热成像数据
  if (data.thermalData) {
    if (data.thermalData.original_8x8) {
      original_8x8.splice(0, original_8x8.length, ...data.thermalData.original_8x8);
    }
    if (data.thermalData.heatData32x32) {
      thermalGrid.value = data.thermalData.heatData32x32;
    }
  }
};

onMounted(() => {
  // 初始化SSE连接
  initSSEConnection();
  
  // 初始加载数据，使用/api前缀以确保通过代理转发到后端
  fetch('/api/battery-summary')
    .then(response => response.json())
    .then(data => {
      updateDashboardData(data);
    })
    .catch(error => {
      console.error('初始数据加载失败:', error);
    });
});

onUnmounted(() => {
  // 清理SSE连接
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
});
</script>

<style scoped>
/* 整页布局样式 */
.dashboard-container {
  padding: 0;
  width: 100%;
  height: 100vh;
  margin: 0;
  background: #f5f7fa;
  overflow-x: hidden;
  overflow-y: auto;
}

.page-title {
  padding: 6px;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 数据概览区域 - 紧凑 */
.data-overview {
  width: 100%;
  padding: 5px;
  margin: 5px;
  margin-bottom: 8px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.08);
  box-sizing: border-box;
}

.data-overview.compact {
  width: 100%;
  padding: 5px;
  margin: 5px;
  margin-bottom: 8px;
}

.overview-header {
  padding: 12px 0;
  margin: 8px 0 12px 0;
  border-bottom: 2px solid #667eea;
}

.overview-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  text-align: center;
}

/* 数据区域 - 紧凑 */
.data-section {
  width: 100%;
  margin-bottom: 6px;
}

.data-section.compact {
  width: 100%;
  margin-bottom: 6px;
}

.data-section:last-child {
  margin-bottom: 0;
}

.data-section h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

/* 环境数据网格 - 紧凑 */
.environment-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 4px;
}

.environment-grid.compact {
  width: 100%;
  gap: 4px;
}

.env-item {
  width: 100%;
  padding: 5px;
  background: #f8f9fa;
  border-radius: 3px;
  text-align: center;
  border: 1px solid #e9ecef;
  box-sizing: border-box;
}

.env-label {
  font-size: 0.7rem;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.env-value {
  font-size: 1rem;
  font-weight: bold;
  color: #2c3e50;
}

/* 统计卡片网格 - 紧凑 */
.stats-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 4px;
}

.stats-grid.compact {
  width: 100%;
  gap: 4px;
}

.stat-card {
  width: 100%;
  display: flex;
  padding: 5px;
  background: white;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border: 1px solid #e9ecef;
  box-sizing: border-box;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  margin-right: 6px;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.bg-primary {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.bg-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.bg-warning {
  background: linear-gradient(135deg, #ffba08 0%, #ff5e00 100%);
  color: white;
}

.bg-danger {
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
  color: white;
}

.stat-info h3 {
  font-size: 0.65rem;
  color: #7f8c8d;
  margin-bottom: 1px;
}

.stat-number {
  font-size: 1rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0;
}

.stat-change {
  font-size: 0.6rem;
  font-weight: 500;
}

.positive {
  color: #2ecc71;
}

.negative {
  color: #e74c3c;
}

/* 其他内容区域样式 - 紧凑 */
.content-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 5px;
  padding: 0 5px 5px 5px;
  box-sizing: border-box;
}

.map-section, .video-section, .activity-section {
  width: 100%;
  padding: 5px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.08);
  box-sizing: border-box;
}

.map-section h3, .video-section h3, .activity-section h3 {
  margin-bottom: 5px;
  color: #2c3e50;
  font-size: 1rem;
}

.map-container {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
  background: #f0f5ff;
  border-radius: 4px;
}

.map-background {
  position: relative;
  width: 100%;
  height: 100%;
  background: #e6f0ff;
}

.facility-layout {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 6px;
  box-sizing: border-box;
}

.building {
  width: 50px;
  height: 50px;
  background: #d1e0f0;
  border: 1px solid #a4c4e0;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a6d8d;
  font-weight: bold;
  font-size: 0.7rem;
}

.corridor {
  width: 70px;
  height: 25px;
  background: #f0f5ff;
  border: 1px dashed #a4c4e0;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  font-size: 0.6rem;
}

.robot-position {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.5s ease;
}

.robot-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #2575fc;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.3s;
}

.robot-icon.moving {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.robot-info {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  padding: 2px 4px;
  margin-top: 3px;
  font-size: 0.55rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.robot-id {
  font-weight: bold;
  color: #2c3e50;
}

.robot-battery {
  color: #7f8c8d;
}

.heat-point {
  position: absolute;
  border-radius: 50%;
  opacity: 0.7;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.heatmap-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.heatmap-overlay-old {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.thermal-cell {
  border: 1px dotted transparent;
  transition: opacity 0.3s ease;
}

.control-panel {
  margin-top: 5px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 4px;
}

.btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 2px;
  background: #fff;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.video-container {
  width: 100%;
  height: 120px;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.video-stream {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-stream img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  background: #2c3e50;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.activity-list {
  list-style: none;
  max-height: 120px;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

.activity-item {
  display: flex;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-icon {
  font-size: 1.1rem;
  margin-right: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 6px;
}

.activity-content {
  flex: 1;
}

.activity-content h4 {
  margin: 0 0 3px 0;
  color: #2c3e50;
  font-size: 0.75rem;
}

.activity-content p {
  margin: 0 0 3px 0;
  color: #7f8c8d;
  font-size: 0.65rem;
  line-height: 1.2;
}

.activity-time {
  font-size: 0.55rem;
  color: #95a5a6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .data-overview {
    margin: 4px;
    padding: 4px;
    margin-bottom: 6px;
  }
  
  .data-overview.compact {
    margin: 4px;
    padding: 4px;
    margin-bottom: 6px;
  }
  
  .environment-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .environment-grid.compact {
    gap: 3px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid.compact {
    gap: 3px;
  }
  
  .stat-card {
    padding: 4px;
  }
  
  .map-container {
    height: 200px;
  }
  
  .video-container {
    height: 100px;
  }
}

@media (max-width: 480px) {
  .environment-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 3px;
  }
  
  .map-section, .video-section, .activity-section {
    margin: 0;
    padding: 4px;
  }
  
  .page-title {
    font-size: 1rem;
    padding: 4px;
    margin-bottom: 4px;
  }
  
  .map-container {
    height: 180px;
  }
  
  .building {
    width: 45px;
    height: 45px;
    font-size: 0.6rem;
  }
  
  .robot-icon {
    width: 24px;
    height: 24px;
  }
}
</style>