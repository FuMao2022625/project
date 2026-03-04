<template>
  <div class="data-management">
    <div class="header-section card">
      <div class="header-content">
        <h2 class="page-title">{{ title || '环境数据监控' }}</h2>
        <p class="subtitle">{{ subtitle || '监控和管理环境传感器数据' }}</p>
      </div>
      <div class="header-actions">
        <div class="category-dropdown">
          <button class="btn btn-category" @click="toggleCategoryDropdown">
            <i class="icon">🏷️</i> {{ selectedCategory || '选择分类' }}
            <i class="icon-arrow" :class="{ 'rotated': showCategoryDropdown }">▼</i>
          </button>
          <transition name="fade">
            <div v-show="showCategoryDropdown" class="dropdown-menu" tabindex="-1">
              <div 
                v-for="category in categoriesList" 
                :key="category.id"
                class="dropdown-item"
                :class="{ 'selected': selectedCategory === category.name }"
                @click="selectCategory(category.name)"
              >
                {{ category.name }}
              </div>
            </div>
          </transition>
        </div>
        <button class="btn btn-primary" @click="importData">
          <i class="icon">📥</i> 导入数据
        </button>
        <button class="btn btn-secondary" @click="exportData" :disabled="!selectedCategory">
          <i class="icon">📤</i> 导出数据
        </button>
        <button class="btn btn-success" @click="createCategory">
          <i class="icon">🗂️</i> 新建分类
        </button>
        <button class="btn btn-warning" @click="refreshData" :disabled="!selectedCategory">
          <i class="icon">🔄</i> 刷新数据
        </button>
      </div>
    </div>

    <div class="data-charts card">
      <div class="chart-section">
        <h3>环境数据曲线</h3>
        <div class="chart-container" v-if="showChart">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>
      <div class="chart-section">
        <h3>风险报表</h3>
        <div class="report-content" v-if="reportGenerated">
          <h4>{{ reportTitle }}</h4>
          <div class="report-stats">
            <div class="stat-card">
              <h5>高频风险点</h5>
              <ul>
                <li v-for="(risk, index) in highRiskPoints" :key="index">
                  <span class="risk-device">{{ risk.device }}</span> 
                  <span class="risk-location">{{ risk.location }}</span>
                  <span class="risk-type">{{ risk.risk }}</span>
                  <span class="risk-level" :class="risk.level.toLowerCase()">{{ risk.level }}</span>
                  <span class="risk-time">{{ risk.time }}</span>
                </li>
              </ul>
            </div>
            
            <div class="stat-card">
              <h5>风险趋势分析</h5>
              <p>{{ riskTrendAnalysis }}</p>
            </div>
            
            <div class="stat-card">
              <h5>管理建议</h5>
              <p>{{ managementSuggestions }}</p>
            </div>
          </div>
        </div>
        <div v-else class="generate-report-section">
          <div class="report-type-selector">
            <label>报表类型：</label>
            <select v-model="reportType">
              <option value="daily">日报</option>
              <option value="weekly">周报</option>
              <option value="monthly">月报</option>
            </select>
          </div>
          <button @click="generateReport" class="btn btn-primary">生成报表</button>
        </div>
      </div>
    </div>

    <div class="data-sequences card">
      <!-- 传感器记录 -->
      <div class="sensor-records">
        <div class="section-header">
          <h3>传感器记录</h3>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>设备编号</th>
              <th>位置</th>
              <th>温度 (°C)</th>
              <th>湿度 (%)</th>
              <th>易燃气体</th>
              <th>烟雾</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sensor in sensors" :key="sensor.id">
              <td>{{ sensor.deviceId }}</td>
              <td>{{ sensor.location }}</td>
              <td :class="sensor.temperature > 60 ? 'high-value' : ''">{{ sensor.temperature }}°C</td>
              <td :class="sensor.humidity > 80 || sensor.humidity < 20 ? 'high-value' : ''">{{ sensor.humidity }}%</td>
              <td :class="sensor.gas > 50 ? 'high-value' : ''">{{ sensor.gas }}ppm</td>
              <td :class="sensor.smoke ? 'high-value' : ''">{{ sensor.smoke ? '是' : '否' }}</td>
              <td>{{ sensor.updateTime }}</td>
              <td>
                <button class="btn btn-small btn-primary" @click="viewSensor(sensor)">查看</button>
                <button class="btn btn-small btn-secondary" @click="editSensor(sensor)">编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 预警记录 -->
      <div class="alarm-records">
        <div class="section-header">
          <h3>预警记录</h3>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>设备名</th>
              <th>预警项</th>
              <th>预警级别</th>
              <th>预警值</th>
              <th>发生时间</th>
              <th>处理状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alarm in alarms" :key="alarm.id">
              <td>{{ alarm.deviceName }}</td>
              <td>{{ alarm.alarmItem }}</td>
              <td>
                <span :class="['alarm-level', alarm.level]">{{ alarm.levelText }}</span>
              </td>
              <td>{{ alarm.value }}</td>
              <td>{{ alarm.time }}</td>
              <td>
                <span :class="['status-badge', alarm.status]">{{ alarm.statusText }}</span>
              </td>
              <td>
                <button class="btn btn-small btn-primary" @click="viewAlarm(alarm)">详情</button>
                <button class="btn btn-small btn-warning" @click="handleAlarm(alarm)" v-if="alarm.status !== 'handled'">处理</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 报告导出 -->
    <div class="export-section card" v-if="reportGenerated">
      <div class="export-header">
        <h3>报告导出</h3>
        <div class="export-controls">
          <button @click="exportPDF" class="btn btn-secondary pdf">
            <i class="icon">📄</i> 导出PDF
          </button>
          <button @click="exportWord" class="btn btn-primary word">
            <i class="icon">📝</i> 导出Word
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 定义 props 以接收外部传入的配置
const props = defineProps({
  title: {
    type: String,
    default: '环境数据监控'
  },
  subtitle: {
    type: String,
    default: '监控和管理环境传感器数据'
  },
  initialCategory: {
    type: String,
    default: ''
  },
  autoRefresh: {
    type: Boolean,
    default: false
  },
  refreshInterval: {
    type: Number,
    default: 30000 // 30 秒
  }
});

// 定义 emits 以向父组件发送事件
const emit = defineEmits(['data-loaded', 'category-selected', 'error']);

// 响应式数据
const startDate = ref('');
const endDate = ref('');
const selectedRegion = ref('');
const reportType = ref('daily');
const showChart = ref(true);
const reportGenerated = ref(false);
const showCategoryDropdown = ref(true);
const selectedCategory = ref(props.initialCategory);

// 自动刷新定时器
let refreshTimer = null;

// 分类列表数据
const categoriesList = ref([
  { id: 1, name: '温度数据' },
  { id: 2, name: '湿度数据' },
  { id: 3, name: '气体浓度' },
  { id: 4, name: '烟雾检测' },
  { id: 5, name: '预警记录' },
  { id: 6, name: '设备状态' }
]);

// 概览数据
const overviewData = ref({
  totalSize: '1.2 TB',
  monthlyGrowth: '12%',
  datasetCount: 42,
  newDatasets: 5,
  monthlyActivity: 78,
  activityChange: 3
});

// 区域数据
const regions = ref([
  { id: 'region1', name: 'A区' },
  { id: 'region2', name: 'B区' },
  { id: 'region3', name: 'C区' },
  { id: 'region4', name: 'D区' },
]);

// 图表数据
const chartData = ref({
  labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
  datasets: [
    {
      label: '环境数据',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      data: [],
      fill: true,
      tension: 0.4,
    },
    {
      label: '温度',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      data: [],
      fill: true,
      tension: 0.4,
    },
    {
      label: '湿度',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      data: [],
      fill: true,
      tension: 0.4,
    }
  ],
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: '环境数据趋势图'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
});

// 报表数据
const reportTitle = ref('');
const highRiskPoints = ref([
  { device: '设备A01', location: '一楼', risk: '高温异常', level: '高', time: '2026-01-15 14:30' },
  { device: '设备B05', location: '二楼', risk: '振动超标', level: '中', time: '2026-01-15 10:15' },
  { device: '设备C12', location: '三楼', risk: '压力异常', level: '高', time: '2026-01-15 09:45' },
  { device: '设备D03', location: '四楼', risk: '温湿度异常', level: '低', time: '2026-01-14 16:20' },
  { device: '设备E07', location: '五楼', risk: '空气质量差', level: '中', time: '2026-01-14 11:10' }
]);
const riskTrendAnalysis = ref('根据近期数据分析，设备故障率较上月下降15%，但仍需重点关注一楼的高温问题。高温风险点数量较上周增加了20%，建议加强相关设备的日常巡检。');
const managementSuggestions = ref('1. 加强一楼设备的日常巡检频次\n2. 对高温异常设备进行专项维保\n3. 优化设备运行参数，减少非计划停机时间\n4. 增加温度监控点位，提高监测精度\n5. 完善应急预案，提高应急响应速度');

// 传感器记录数据
const sensors = ref([
  { id: 1, deviceId: 'T001', location: '一楼大厅', temperature: 25, humidity: 45, gas: 15, smoke: false, updateTime: '2026-01-28 14:20' },
  { id: 2, deviceId: 'T002', location: '二楼办公室', temperature: 23, humidity: 50, gas: 10, smoke: false, updateTime: '2026-01-28 14:15' },
  { id: 3, deviceId: 'T003', location: '三楼实验室', temperature: 65, humidity: 85, gas: 60, smoke: true, updateTime: '2026-01-28 14:25' },
  { id: 4, deviceId: 'T004', location: '地下室', temperature: 18, humidity: 90, gas: 5, smoke: false, updateTime: '2026-01-28 14:10' },
  { id: 5, deviceId: 'T005', location: '天台', temperature: 20, humidity: 40, gas: 20, smoke: false, updateTime: '2026-01-28 14:18' }
]);

// 预警记录数据
const alarms = ref([
  { id: 1, deviceName: '设备A01', alarmItem: '温度', level: 'high', levelText: '高温', value: '65°C', time: '2026-01-28 10:30', status: 'pending', statusText: '待处理' },
  { id: 2, deviceName: '设备B05', alarmItem: '湿度', level: 'high', levelText: '高湿', value: '85%', time: '2026-01-28 11:15', status: 'handled', statusText: '已处理' },
  { id: 3, deviceName: '设备C12', alarmItem: '电量', level: 'low', levelText: '低电', value: '15%', time: '2026-01-28 09:45', status: 'pending', statusText: '待处理' },
  { id: 4, deviceName: '设备D03', alarmItem: '可燃物', level: 'high', levelText: '危险', value: '70ppm', time: '2026-01-28 12:20', status: 'handling', statusText: '处理中' },
  { id: 5, deviceName: '设备E07', alarmItem: '温度', level: 'critical', levelText: '危急', value: '85°C', time: '2026-01-27 16:30', status: 'handled', statusText: '已处理' }
]);

onMounted(() => {
  console.log('数据管理页面已加载');
  
  // 初始化默认日期范围
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  startDate.value = formatDate(oneWeekAgo);
  endDate.value = formatDate(today);
});

// 格式化日期为 YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 监听selectedCategory变化
watch(selectedCategory, (newVal) => {
  emit('category-selected', newVal);
});

// 分类选择相关方法
const toggleCategoryDropdown = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value;
};

// 添加点击外部关闭菜单的处理
const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.category-dropdown');
  if (dropdown && !dropdown.contains(event.target)) {
    showCategoryDropdown.value = false;
  }
};

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    showCategoryDropdown.value = false;
  }
};

// 监听全局点击事件
onMounted(() => {
  console.log('数据管理页面已加载');
  
  // 初始化默认日期范围
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  startDate.value = formatDate(oneWeekAgo);
  endDate.value = formatDate(today);
  
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  
  // 获取环境数据
  // fetchEnvironmentData(); // 已注释 API 调用
  
  // 如果启用了自动刷新，设置定时器
  if (props.autoRefresh) {
    refreshTimer = setInterval(fetchEnvironmentData, props.refreshInterval);
  }
});

// 组件卸载前移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
  // 清除定时器
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

const selectCategory = (categoryName) => {
  selectedCategory.value = categoryName;
  showCategoryDropdown.value = false;
  // 这里可以添加根据分类筛选数据的逻辑
  emit('category-selected', categoryName);
};

// 查询历史数据
const queryHistoricalData = () => {
  if (!startDate.value || !endDate.value) {
    alert('请选择时间范围');
    return;
  }
  
  // 显示查询结果
  alert(`查询从 ${startDate.value} 到 ${endDate.value} 的${selectedCategory.value ? selectedCategory.value : '全部'}数据`);
};

// 生成报表
const generateReport = () => {
  reportTitle.value = `${getReportTypeName()} - ${new Date().toLocaleDateString('zh-CN')}`;
  reportGenerated.value = true;
};

const getReportTypeName = () => {
  switch(reportType.value) {
    case 'daily': return '每日风险报告';
    case 'weekly': return '每周风险报告';
    case 'monthly': return '每月风险报告';
    default: return '风险报告';
  }
};

// 导出PDF
const exportPDF = () => {
  alert('正在导出PDF报告...');
  // 这里应该实现PDF导出逻辑
  // 可以使用如jsPDF等库来实现
};

// 导出Word
const exportWord = () => {
  alert('正在导出Word报告...');
  // 这里应该实现Word导出逻辑
  // 可以使用如docx等库来实现
};

// 其他操作方法
const importData = () => {
  alert('导入数据功能');
};

const exportData = () => {
  alert('导出数据功能');
};

const createCategory = () => {
  alert('新建分类功能');
};

const viewSensor = (sensor) => {
  alert(`查看传感器: ${sensor.deviceId} - ${sensor.location}`);
};

const editSensor = (sensor) => {
  alert(`编辑传感器: ${sensor.deviceId} - ${sensor.location}`);
};

const viewAlarm = (alarm) => {
  alert(`预警详情: ${alarm.deviceName} - ${alarm.alarmItem}`);
};

const handleAlarm = (alarm) => {
  alert(`处理预警: ${alarm.deviceName} - ${alarm.alarmItem}`);
  // 更新状态为处理中
  alarm.status = 'handling';
  alarm.statusText = '处理中';
};

// 获取环境数据
const fetchEnvironmentData = async () => {
  // try {
  //   // 尝试从多个可能的 API 端点获取数据
  //   let response;
  //   let apiUrl;
    
  //   for (const endpoint of props.apiEndpoints) {
  //     try {
  //       apiUrl = endpoint;
  //       response = await fetch(apiUrl, {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json'
  //         }
  //       });
        
  //       if (response.ok) {
  //         break; // 成功获取数据，跳出循环
  //       }
  //     } catch (error) {
  //       console.warn(`无法连接到 ${apiUrl}:`, error);
  //       continue; // 继续尝试下一个 API 端点
  //     }
  //   }
    
  //   if (!response || !response.ok) {
  //     throw new Error('无法从任何 API 端点获取数据');
  //   }

  //   const data = await response.json();
  //   console.log('环境数据:', data);
    
  //   // 更新图表数据
  //   updateChartData(data);
    
  //   // 触发数据加载完成事件
  //   emit('data-loaded', data);
  // } catch (error) {
  //   console.error('获取环境数据失败:', error);
  //   alert('获取环境数据失败：' + error.message);
  //   emit('error', error);
  // }
  
  // 使用模拟数据代替 API 调用
  console.log('API 接口已注释，使用模拟数据');
  const mockData = {
    labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'],
    datasets: [
      {
        label: '环境数据',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        data: [12, 19, 15, 17, 14, 20],
        fill: true,
        tension: 0.4,
      },
      {
        label: '温度',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        data: [22, 24, 26, 28, 30, 32],
        fill: true,
        tension: 0.4,
      },
      {
        label: '湿度',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        data: [45, 50, 55, 60, 65, 70],
        fill: true,
        tension: 0.4,
      }
    ],
  };
  
  updateChartData(mockData);
  emit('data-loaded', mockData);
};

// 更新图表数据
const updateChartData = (data) => {
  // 检查是否有数据
  if (!data) {
    console.warn('环境数据为空');
    return;
  }
  
  // 尝试不同的数据格式
  if (data.labels && Array.isArray(data.datasets)) {
    // 如果数据已经是期望的图表格式，则直接使用
    chartData.value.labels = data.labels || chartData.value.labels;
    
    // 更新现有的数据集
    for (let i = 0; i < chartData.value.datasets.length; i++) {
      if (data.datasets[i]) {
        Object.assign(chartData.value.datasets[i], data.datasets[i], {
          fill: true,
          tension: 0.4
        });
      }
    }
    
    // 如果API提供了额外的数据集，添加它们
    if (data.datasets.length > chartData.value.datasets.length) {
      for (let i = chartData.value.datasets.length; i < data.datasets.length; i++) {
        chartData.value.datasets.push({
          ...data.datasets[i],
          fill: true,
          tension: 0.4
        });
      }
    }
  } else if (Array.isArray(data) && data.length > 0) {
    // 如果返回的是传感器数据数组
    if (data[0].hasOwnProperty('temperature') || data[0].hasOwnProperty('humidity') || data[0].hasOwnProperty('gas')) {
      // 假设这是传感器数据
      const labels = data.map((_, index) => `传感器${index + 1}`);
      const temperatureData = data.map(item => item.temperature || 0);
      const humidityData = data.map(item => item.humidity || 0);
      const gasData = data.map(item => item.gas || 0);
      
      chartData.value.labels = labels;
      chartData.value.datasets[0].data = temperatureData;
      chartData.value.datasets[1].data = humidityData;
      chartData.value.datasets[2].data = gasData;
    } else if (data[0].hasOwnProperty('name') && data[0].hasOwnProperty('battery')) {
      // 假设这是机器人数据
      const labels = data.map(item => item.name);
      const batteryData = data.map(item => item.battery || 0);
      const statusData = data.map(item => item.status === '在线' ? 1 : item.status === '警告' ? 0.5 : 0);
      
      chartData.value.labels = labels;
      chartData.value.datasets[0].data = batteryData;
      chartData.value.datasets[1].data = statusData;
    } else {
      // 如果是简单的数值数组
      const labels = data.map((_, index) => `项目${index + 1}`);
      chartData.value.labels = labels;
      chartData.value.datasets[0].data = data.map(item => typeof item === 'object' ? item.value : item);
    }
  } else if (typeof data === 'object') {
    // 如果返回的是对象形式，尝试解析可能的数据结构
    if (data.hasOwnProperty('robots') && Array.isArray(data.robots)) {
      // 如果是包含机器人的数据结构
      const robots = data.robots;
      const labels = robots.map(item => item.name || `机器人${item.id}`);
      const batteryData = robots.map(item => item.battery || 0);
      const statusData = robots.map(item => item.status === '在线' ? 1 : item.status === '警告' ? 0.5 : 0);
      
      chartData.value.labels = labels;
      chartData.value.datasets[0].data = batteryData;
      chartData.value.datasets[1].data = statusData;
    } else if (data.hasOwnProperty('sensors') && Array.isArray(data.sensors)) {
      // 如果是包含传感器的数据结构
      const sensors = data.sensors;
      const labels = sensors.map((_, index) => `传感器${index + 1}`);
      const temperatureData = sensors.map(item => item.temperature || 0);
      const humidityData = sensors.map(item => item.humidity || 0);
      const gasData = sensors.map(item => item.gas || 0);
      
      chartData.value.labels = labels;
      chartData.value.datasets[0].data = temperatureData;
      chartData.value.datasets[1].data = humidityData;
      chartData.value.datasets[2].data = gasData;
    } else {
      // 尝试从对象中提取常见属性
      const labels = [];
      const values = [];
      
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
          // 如果值是数组，假设是时间序列数据
          if (key.includes('temperatur') || key.includes('温度')) {
            labels.length = 0; // 清空labels
            value.forEach((item, idx) => {
              if (typeof item === 'object' && item.label) {
                labels.push(item.label);
              } else {
                labels.push(`时间点${idx + 1}`);
              }
            });
            chartData.value.datasets[0].data = value.map(item => typeof item === 'object' ? item.value : item);
          } else if (key.includes('humid') || key.includes('湿度')) {
            if (labels.length === 0) {
              value.forEach((_, idx) => labels.push(`时间点${idx + 1}`));
            }
            chartData.value.datasets[1].data = value.map(item => typeof item === 'object' ? item.value : item);
          } else if (key.includes('gas') || key.includes('气体')) {
            if (labels.length === 0) {
              value.forEach((_, idx) => labels.push(`时间点${idx + 1}`));
            }
            chartData.value.datasets[2].data = value.map(item => typeof item === 'object' ? item.value : item);
          }
        } else if (typeof value === 'number') {
          // 如果是单个数值
          labels.push(key);
          values.push(value);
        }
      });
      
      // 如果没有从特殊处理中得到数据，使用通用处理
      if (labels.length === 0) {
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (typeof value === 'number') {
            labels.push(key);
            values.push(value);
          }
        });
        
        if (labels.length > 0) {
          chartData.value.labels = labels;
          chartData.value.datasets[0].data = values;
        } else {
          // 如果仍然没有识别出有效数据，保持原有数据不变
          console.warn('未能从API响应中识别出有效数据结构，使用默认数据');
          return;
        }
      }
    }
  } else {
    console.warn('环境数据格式不正确或无法识别');
    return;
  }
  
  console.log('图表数据已更新', chartData.value);
};

// 生成随机颜色的辅助函数
const getRandomColor = (alpha) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 页面加载时获取环境数据
onMounted(() => {
  console.log('数据管理页面已加载');
  
  // 初始化默认日期范围
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  startDate.value = formatDate(oneWeekAgo);
  endDate.value = formatDate(today);
  
  document.addEventListener('click', handleClickOutside);
  
  // 获取环境数据
  // fetchEnvironmentData(); // 已注释 API 调用
});

</script>

<style scoped>
.data-management {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: visible; /* 确保下拉菜单可以显示 */
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  margin-bottom: 40px;
  overflow: visible; /* 确保下拉菜单可以显示 */
  position: relative; /* 确保定位上下文 */
}

.header-content {
  flex: 1;
}

.header-content .page-title {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 1.8rem;
  font-weight: 600;
}

.header-content .subtitle {
  color: #7f8c8d;
  margin-top: 0;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  position: relative;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn i.icon {
  font-style: normal;
  font-size: 1em;
}

.btn-category {
  background: linear-gradient(135deg, #6a8de6 0%, #5b7be0 100%);
  color: white;
  position: relative;
  min-width: 120px;
}

.category-dropdown {
  position: relative;
  display: inline-block;
  z-index: 1000;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999; /* 提高z-index值确保显示在最顶层 */
  max-height: 200px;
  overflow-y: auto;
  width: 200px;
  transform-origin: top left;
  /* 确保菜单内容不会被裁剪 */
  overflow: visible;
  min-width: 100%; /* 确保菜单至少与按钮同宽 */
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
  transform: scaleY(1);
  opacity: 1;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

.dropdown-item {
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.selected {
  background-color: #e3f2fd;
  font-weight: 500;
}

.dropdown-item.selected:hover {
  background-color: #bbdefb;
}

.icon-arrow {
  margin-left: auto;
  font-size: 0.7em;
  transition: transform 0.3s;
}

.icon-arrow.rotated {
  transform: rotate(180deg);
}

.btn-primary {
  background: linear-gradient(135deg, #42b983 0%, #2d7c5f 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}

.btn-warning {
  background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
  color: white;
}

.btn-warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.data-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
}

.chart-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.chart-container {
  height: 300px;
  margin-top: 10px;
}

.report-content h4 {
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.stat-card {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.stat-card h5 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #42b983;
  font-size: 1rem;
  font-weight: 600;
}

.stat-card ul {
  padding-left: 0;
  margin: 8px 0;
}

.stat-card li {
  list-style: none;
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.risk-device {
  font-weight: bold;
  color: #2c3e50;
  flex: 1;
}

.risk-location {
  color: #7f8c8d;
  flex: 1;
}

.risk-type {
  color: #3498db;
  flex: 1;
}

.risk-level {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  flex: 0.5;
}

.risk-level.high {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.risk-level.medium {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.risk-level.low {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.risk-time {
  color: #95a5a6;
  flex: 1;
  text-align: right;
}

.stat-card p {
  margin: 8px 0;
  line-height: 1.5;
}

.generate-report-section {
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.report-type-selector {
  margin-bottom: 15px;
}

.report-type-selector label {
  margin-right: 10px;
  font-weight: 500;
  color: #2c3e50;
}

.report-type-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.data-sequences {
  padding: 20px;
}

.section-header {
  margin-bottom: 15px;
}

.section-header h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: inline-block;
  border-bottom: 2px solid #42b983;
  padding-bottom: 5px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.table th, .table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.high-value {
  color: #e74c3c;
  font-weight: bold;
}

.alarm-level {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.alarm-level.high {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.alarm-level.critical {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.alarm-level.low {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
}

.status-badge.pending {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.status-badge.handling {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.status-badge.handled {
  background: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
  margin-right: 5px;
}

.export-section {
  padding: 20px;
}

.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.export-header h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.export-controls {
  display: flex;
  gap: 10px;
}

@media (max-width: 992px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .header-actions {
    align-self: stretch;
    justify-content: center;
  }
  
  .data-charts {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .table-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .query-controls {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .stat-card li {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .risk-time {
    text-align: left;
  }
  
  .table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .header-actions > button {
    width: 100%;
  }
  
  .export-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .export-controls > button {
    width: 100%;
  }
  
  .data-charts {
    grid-template-columns: 1fr;
  }
}
</style>
