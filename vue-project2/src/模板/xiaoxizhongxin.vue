<template>
  <div class="message-center">
    <div class="header-section card">
      <div class="header-content">
        <h2 class="page-title">消息中心</h2>
        <p class="subtitle">查看和管理您的所有消息</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary">
          <i class="icon">🧹</i> 清空消息
        </button>
        <button class="btn">
          <i class="icon">⚙️</i> 设置
        </button>
      </div>
    </div>

    <!-- 分级预警看板 -->
    <div class="warning-dashboard card">
      <h3>分级预警看板</h3>
      <div class="warning-levels">
        <div class="warning-level red">
          <div class="level-header">
            <i class="icon">🔥</i>
            <h4>红色预警 - 明火</h4>
            <span class="count">{{ getWarningCount('red') }}</span>
          </div>
          <div class="level-description">检测到火焰或极高温度异常</div>
        </div>
        <div class="warning-level orange">
          <div class="level-header">
            <i class="icon">🌡️</i>
            <h4>橙色预警 - 高温+无人</h4>
            <span class="count">{{ getWarningCount('orange') }}</span>
          </div>
          <div class="level-description">高温区域检测不到人员活动</div>
        </div>
        <div class="warning-level yellow">
          <div class="level-header">
            <i class="icon">⚠️</i>
            <h4>黄色预警 - 温度异常</h4>
            <span class="count">{{ getWarningCount('yellow') }}</span>
          </div>
          <div class="level-description">温度超出正常范围</div>
        </div>
        <div class="warning-level blue">
          <div class="level-header">
            <i class="icon">ℹ️</i>
            <h4>蓝色预警 - 设备异常</h4>
            <span class="count">{{ getWarningCount('blue') }}</span>
          </div>
          <div class="level-description">设备运行状态异常</div>
        </div>
      </div>
    </div>

    <div class="message-stats">
      <div class="stat-card card">
        <div class="stat-icon bg-primary">
          <i class="icon">✉️</i>
        </div>
        <div class="stat-info">
          <h3>全部消息</h3>
          <p class="stat-number">{{ allMessages.length }}</p>
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon bg-success">
          <i class="icon">📧</i>
        </div>
        <div class="stat-info">
          <h3>未读消息</h3>
          <p class="stat-number">{{ unreadCount }}</p>
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon bg-warning">
          <i class="icon">🔔</i>
        </div>
        <div class="stat-info">
          <h3>提醒消息</h3>
          <p class="stat-number">{{ alertCount }}</p>
        </div>
      </div>
    </div>

    <div class="message-layout">
      <div class="message-sidebar card">
        <div class="message-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'all' }]"
            @click="activeTab = 'all'"
          >
            全部消息
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'unread' }]"
            @click="activeTab = 'unread'"
          >
            未读消息
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'alerts' }]"
            @click="activeTab = 'alerts'"
          >
            系统提醒
          </button>
        </div>
        
        <div class="message-categories">
          <h4>消息分类</h4>
          <ul class="category-list">
            <li 
              v-for="category in categories" 
              :key="category.id"
              :class="['category-item', { active: activeCategory === category.id }]"
              @click="activeCategory = category.id"
            >
              {{ category.name }}
              <span class="badge">{{ getCategoryCount(category.id) }}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="message-content card">
        <div class="message-filters">
          <select class="input-field" style="width: auto;" v-model="filterLevel">
            <option value="">全部类型</option>
            <option value="red">红色预警</option>
            <option value="orange">橙色预警</option>
            <option value="yellow">黄色预警</option>
            <option value="blue">蓝色预警</option>
            <option value="notification">通知</option>
            <option value="system">系统</option>
          </select>
          <button class="btn btn-secondary">标记为已读</button>
        </div>
        
        <div class="messages-list">
          <div 
            v-for="message in filteredMessages" 
            :key="message.id" 
            :class="['message-item', { unread: message.unread }, message.level || '']"
          >
            <div class="message-header">
              <div class="message-type-icon" :class="message.type">
                <i>{{ getTypeIcon(message.type) }}</i>
              </div>
              <h4 class="message-title">{{ message.title }}</h4>
              <span class="message-time">{{ message.time }}</span>
              <span v-if="message.level" class="level-badge" :class="message.level">
                {{ getLevelText(message.level) }}
              </span>
              <button 
                v-if="message.unread" 
                class="mark-read-btn"
                @click="markAsRead(message)"
              >
                标记已读
              </button>
            </div>
            <div class="message-content-body">
              <p>{{ message.content }}</p>
            </div>
            <div class="message-actions">
              <button 
                v-if="message.isAlert" 
                class="btn btn-small" 
                @click="showEvidenceModal(message)"
              >
                查看证据链
              </button>
              <button 
                v-if="message.isAlert" 
                :class="['btn', 'btn-small', message.processed ? 'btn-secondary' : 'btn-warning']"
                @click="toggleProcessed(message)"
              >
                {{ message.processed ? '已处理' : '标记处理' }}
              </button>
              <button class="btn btn-small btn-secondary">稍后处理</button>
            </div>
          </div>
          
          <div v-if="filteredMessages.length === 0" class="no-messages">
            <p>暂无消息</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 预警证据链模态框 -->
    <div v-if="showEvidence" class="modal-overlay" @click="closeEvidenceModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>预警证据链</h3>
          <button class="close-btn" @click="closeEvidenceModal">×</button>
        </div>
        <div class="evidence-content">
          <div class="evidence-section">
            <h4>热成像温度图</h4>
            <div class="thermal-image">
              <div class="heatmap-simulation">
                <div 
                  v-for="(row, rowIndex) in currentEvidence.thermalData" 
                  :key="'row'+rowIndex"
                  class="thermal-row"
                >
                  <div 
                    v-for="(cell, cellIndex) in row" 
                    :key="'cell'+cellIndex"
                    class="thermal-cell"
                    :style="{ backgroundColor: getThermalColor(cell.temp) }"
                    :title="`温度: ${cell.temp}°C`"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="evidence-section">
            <h4>雷达人体检测状态</h4>
            <div class="radar-log">
              <p><strong>时间:</strong> {{ currentEvidence.radarLog.timestamp }}</p>
              <p><strong>状态:</strong> 
                <span :class="['status', currentEvidence.radarLog.presence ? 'present' : 'absent']">
                  {{ currentEvidence.radarLog.presence ? '检测到人员' : '未检测到人员' }}
                </span>
              </p>
              <p><strong>区域:</strong> {{ currentEvidence.radarLog.area }}</p>
            </div>
          </div>
          
          <div class="evidence-section">
            <h4>现场照片</h4>
            <div class="photo-evidence">
              <img :src="currentEvidence.photoUrl" alt="现场照片" />
            </div>
          </div>
          
          <div class="processing-section">
            <h4>处理记录</h4>
            <div v-if="currentMessage.processRecord">
              <p><strong>处理人:</strong> {{ currentMessage.processRecord.processor }}</p>
              <p><strong>处理时间:</strong> {{ currentMessage.processRecord.processTime }}</p>
              <p><strong>处理说明:</strong> {{ currentMessage.processRecord.description }}</p>
            </div>
            <div v-else>
              <p>尚未处理</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer" v-if="!currentMessage.processed">
          <textarea 
            v-model="processDescription" 
            placeholder="请输入处理说明..."
            class="process-input"
          ></textarea>
          <button class="btn btn-primary" @click="recordProcess">确认处理</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const activeTab = ref('all');
const activeCategory = ref(1);
const filterLevel = ref('');
const showEvidence = ref(false);
const currentMessage = ref(null);
const currentEvidence = ref({});
const processDescription = ref('');

const messages = ref([
  {
    id: 1,
    title: '红色预警：检测到明火',
    content: '传感器 #A123 检测到火焰，温度超过100°C',
    time: '10分钟前',
    type: 'alert',
    unread: true,
    category: 1,
    level: 'red',
    isAlert: true,
    processed: false,
    processRecord: null
  },
  {
    id: 2,
    title: '橙色预警：高温+无人',
    content: 'B栋3楼温度达到65°C，但未检测到人员活动',
    time: '30分钟前',
    type: 'alert',
    unread: true,
    category: 2,
    level: 'orange',
    isAlert: true,
    processed: false,
    processRecord: null
  },
  {
    id: 3,
    title: '黄色预警：温度异常',
    content: 'C栋2楼温度持续高于正常范围',
    time: '2小时前',
    type: 'alert',
    unread: false,
    category: 3,
    level: 'yellow',
    isAlert: true,
    processed: true,
    processRecord: {
      processor: '张三',
      processTime: '今天 14:30',
      description: '检查发现空调故障，已联系维修'
    }
  },
  {
    id: 4,
    title: '蓝色预警：设备异常',
    content: '温度传感器 #T001 信号不稳定',
    time: '昨天',
    type: 'alert',
    unread: false,
    category: 1,
    level: 'blue',
    isAlert: true,
    processed: false,
    processRecord: null
  },
  {
    id: 5,
    title: '安全警报',
    content: '检测到异常登录尝试，来自未知IP地址',
    time: '昨天',
    type: 'alert',
    unread: false,
    category: 2,
    level: '',
    isAlert: false,
    processed: false,
    processRecord: null
  }
]);

const categories = ref([
  { id: 1, name: '设备通知' },
  { id: 2, name: '系统提醒' },
  { id: 3, name: '权限管理' },
  { id: 4, name: '数据同步' }
]);

const allMessages = computed(() => messages.value);
const unreadCount = computed(() => messages.value.filter(m => m.unread).length);
const alertCount = computed(() => messages.value.filter(m => m.type === 'alert').length);

const filteredMessages = computed(() => {
  let filtered = [...messages.value];
  
  // Filter by tab
  if (activeTab.value === 'unread') {
    filtered = filtered.filter(m => m.unread);
  } else if (activeTab.value === 'alerts') {
    filtered = filtered.filter(m => m.type === 'alert');
  }
  
  // Filter by category
  if (activeCategory.value) {
    filtered = filtered.filter(m => m.category === activeCategory.value);
  }
  
  // Filter by level
  if (filterLevel.value) {
    filtered = filtered.filter(m => m.level === filterLevel.value);
  }
  
  return filtered;
});

const getCategoryCount = (categoryId) => {
  return messages.value.filter(m => m.category === categoryId).length;
};

const getWarningCount = (level) => {
  return messages.value.filter(m => m.level === level && m.isAlert).length;
};

const getLevelText = (level) => {
  switch(level) {
    case 'red': return '红色预警';
    case 'orange': return '橙色预警';
    case 'yellow': return '黄色预警';
    case 'blue': return '蓝色预警';
    default: return '';
  }
};

const markAsRead = (message) => {
  message.unread = false;
};

const getTypeIcon = (type) => {
  switch(type) {
    case 'alert': return '⚠️';
    case 'notification': return '📢';
    case 'system': return '⚙️';
    case 'info': return 'ℹ️';
    default: return '✉️';
  }
};

const showEvidenceModal = (message) => {
  currentMessage.value = message;
  
  // 生成证据数据
  currentEvidence.value = {
    thermalData: [
      [{temp: 23}, {temp: 25}, {temp: 30}, {temp: 65}, {temp: 95}],
      [{temp: 22}, {temp: 24}, {temp: 28}, {temp: 70}, {temp: 120}],
      [{temp: 21}, {temp: 26}, {temp: 32}, {temp: 80}, {temp: 110}],
      [{temp: 20}, {temp: 25}, {temp: 35}, {temp: 85}, {temp: 90}],
      [{temp: 19}, {temp: 24}, {temp: 30}, {temp: 75}, {temp: 60}]
    ],
    radarLog: {
      timestamp: message.time,
      presence: message.level === 'orange' ? false : true,
      area: 'B栋3楼'
    },
    photoUrl: '/images/evidence-photo.jpg' // 证据图片URL
  };
  
  showEvidence.value = true;
};

const closeEvidenceModal = () => {
  showEvidence.value = false;
  currentMessage.value = null;
  currentEvidence.value = {};
  processDescription.value = '';
};

const getThermalColor = (temp) => {
  // 根据温度返回对应颜色，符合风险热力图颜色编码规范
  if (temp < 30) return 'rgba(33, 150, 243, 0.6)'; // 蓝色
  if (temp <= 60) return 'rgba(33, 150, 243, 0.8)'; // 浅蓝
  if (temp <= 70) return 'rgba(255, 193, 7, 0.6)'; // 黄色
  if (temp <= 90) return 'rgba(255, 152, 0, 0.7)'; // 橙色
  return 'rgba(244, 67, 54, 0.6)'; // 红色
};

const toggleProcessed = (message) => {
  if (!message.processed) {
    showEvidenceModal(message);
  }
};

const recordProcess = () => {
  if (!processDescription.value.trim()) {
    alert('请输入处理说明');
    return;
  }
  
  currentMessage.value.processed = true;
  currentMessage.value.processRecord = {
    processor: '当前用户',
    processTime: new Date().toLocaleString(),
    description: processDescription.value
  };
  
  closeEvidenceModal();
};
</script>

<style scoped>
.message-center {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  margin-bottom: 20px;
}

.header-content {
  flex: 1;
}

.header-content .subtitle {
  color: #7f8c8d;
  margin-top: 5px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.warning-dashboard {
  padding: 20px;
  margin-bottom: 20px;
}

.warning-dashboard h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.warning-levels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 15px;
}

.warning-level {
  padding: 15px;
  border-radius: 8px;
  color: white;
}

.warning-level.red {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.warning-level.orange {
  background: linear-gradient(135deg, #f39c12, #d35400);
}

.warning-level.yellow {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: #333;
}

.warning-level.blue {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.level-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.level-header .icon {
  font-size: 1.5rem;
  margin-right: 10px;
}

.level-header h4 {
  flex: 1;
  margin: 0;
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.level-description {
  font-size: 0.9rem;
  opacity: 0.9;
}

.message-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  padding: 20px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  margin-right: 15px;
  font-size: 1.5rem;
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

.stat-info h3 {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
}

.message-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
}

.message-sidebar {
  padding: 20px;
  height: fit-content;
}

.message-tabs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 15px;
  border: none;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
}

.tab-btn.active, .tab-btn:hover {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.message-categories h4 {
  margin: 20px 0 15px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.category-list {
  list-style: none;
}

.category-item {
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s ease;
}

.category-item:hover, .category-item.active {
  background: #f8f9fa;
}

.badge {
  background: #e0e0e0;
  color: #555;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 0.8rem;
}

.message-content {
  padding: 20px;
}

.message-filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
  transition: all 0.3s ease;
}

.message-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.message-item.unread {
  border-left-color: #3498db;
  background-color: rgba(52, 152, 219, 0.05);
}

.message-item.red {
  border-left-color: #e74c3c;
}

.message-item.orange {
  border-left-color: #f39c12;
}

.message-item.yellow {
  border-left-color: #f1c40f;
}

.message-item.blue {
  border-left-color: #3498db;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.message-type-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.message-type-icon.alert {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.message-type-icon.notification {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.message-type-icon.system {
  background: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
}

.message-type-icon.info {
  background: rgba(52, 73, 94, 0.1);
  color: #34495e;
}

.message-title {
  flex: 1;
  margin: 0;
  color: #2c3e50;
}

.message-time {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.level-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
}

.level-badge.red {
  background: #e74c3c;
}

.level-badge.orange {
  background: #f39c12;
}

.level-badge.yellow {
  background: #f1c40f;
  color: #333;
}

.level-badge.blue {
  background: #3498db;
}

.mark-read-btn {
  background: #e0e0e0;
  color: #555;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.3s ease;
}

.mark-read-btn:hover {
  background: #d0d0d0;
}

.message-content-body {
  margin-bottom: 15px;
}

.message-content-body p {
  color: #555;
  line-height: 1.6;
}

.message-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.no-messages {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #777;
}

.evidence-content {
  padding: 20px;
  overflow-y: auto;
}

.evidence-section {
  margin-bottom: 25px;
}

.evidence-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.thermal-image {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.heatmap-simulation {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.thermal-row {
  display: flex;
  gap: 2px;
}

.thermal-cell {
  width: 30px;
  height: 30px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.thermal-cell:hover {
  transform: scale(1.2);
  z-index: 1;
}

.radar-log {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.radar-log .status.present {
  color: #27ae60;
  font-weight: bold;
}

.radar-log .status.absent {
  color: #e74c3c;
  font-weight: bold;
}

.photo-evidence {
  text-align: center;
}

.photo-evidence img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.processing-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.process-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.btn-warning {
  background: #f39c12;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 992px) {
  .message-layout {
    grid-template-columns: 1fr;
  }
  
  .message-sidebar {
    display: none;
  }
  
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .header-actions {
    align-self: stretch;
    justify-content: center;
  }
  
  .warning-levels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .message-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .message-title {
    width: 100%;
  }
  
  .message-time {
    align-self: flex-end;
  }
  
  .message-filters {
    flex-direction: column;
  }
}
</style>