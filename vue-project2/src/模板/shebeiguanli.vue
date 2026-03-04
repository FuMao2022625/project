<template>
  <div class="equipment-management">
    <div class="header-section card">
      <div class="header-content">
        <h2 class="page-title">机器人管理</h2>
        <p class="subtitle">管理和监控您的所有设备</p>
      </div>
      <div class="header-actions">
        <button class="btn" @click="showAddDeviceModal = true">
          <i class="icon">➕</i> 添加设备
        </button>
        <button class="btn btn-secondary" @click="showBatchModal = true">
          <i class="icon">⚙️</i> 批量操作
        </button>
      </div>
    </div>

    <!-- 机器人管理部分 - 明确区分巡检操作和机器人列表 -->
    <div class="robot-management card">
      <!-- 巡检操作区 -->
      <div class="section-header">
        <h3>巡检管理</h3>
        <div class="robot-actions">
          <button class="btn btn-primary" @click="sendCommand('start')">开始巡检</button>
          <button class="btn btn-warning" @click="sendCommand('stop')">停止巡检</button>
          <button class="btn btn-secondary" @click="sendCommand('return')">返回充电</button>
          <button class="btn btn-secondary" @click="showAddRobotModal = true">添加机器人</button>
        </div>
      </div>

      <!-- 机器人列表区 - 明确标注标题 -->
      <div class="robot-list-section">
        <h4 class="robot-list-title">机器人列表</h4>
        <div class="robot-list">
          <table class="table">
            <thead>
              <tr>
                <th>机器人ID</th>
                <th>机器人名称</th>
                <th>状态</th>
                <th>电量</th>
                <th>位置</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <!-- 遍历所有机器人数据，包括新增的 -->
              <tr v-for="robot in robots" :key="robot.id">
                <td>{{ robot.id }}</td>
                <td>{{ robot.name }}</td>
                <td>
                  <span class="status-badge" :class="robot.statusClass">{{ robot.status }}</span>
                </td>
                <td>{{ robot.battery }}%</td>
                <td>{{ robot.location }}</td>
                <td>
                  <button class="btn btn-small btn-primary" @click="sendRobotCommand(robot.id, 'start')">开始巡检</button>
                  <button class="btn btn-small btn-warning" @click="sendRobotCommand(robot.id, 'stop')">停止巡检</button>
                  <button class="btn btn-small btn-secondary" @click="sendRobotCommand(robot.id, 'return')">返回充电</button>
                  <button class="btn btn-small btn-secondary" @click="openEditPlan(robot.id)">编辑</button>
                </td>
              </tr>
              <!-- 空列表提示 -->
              <tr v-if="robots.length === 0">
                <td colspan="6" class="empty-list">暂无机器人数据，请添加机器人</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 巡检计划部分 -->
    <div class="inspection-plans card">
      <div class="section-header">
        <h3>巡检计划</h3>
        <button class="btn btn-primary" @click="showAddPlanModal = true">添加计划</button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>计划名称</th>
            <th>执行时间</th>
            <th>周期</th>
            <th>关联机器人</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in inspectionPlans" :key="plan.id">
            <td>{{ plan.name }}</td>
            <td>{{ plan.time }}</td>
            <td>{{ plan.cycle }}</td>
            <td>{{ getRobotNameById(plan.assignedRobot) }}</td>
            <td>
              <span :class="['status-badge', plan.enabled ? 'status-active' : 'status-inactive']">
                {{ plan.enabled ? '启用' : '停用' }}
              </span>
            </td>
            <td>
              <button class="btn btn-small btn-primary" @click="openEditPlanModal(plan)">编辑</button>
              <button class="btn btn-small btn-warning" @click="deletePlan(plan.id)">删除</button>
            </td>
          </tr>
          <tr v-if="inspectionPlans.length === 0">
            <td colspan="6" class="empty-list">暂无巡检计划，请添加</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="filters-section card">
      <div class="filter-controls">
        <select class="input-field" style="width: auto;" v-model="statusFilter">
          <option value="">所有状态</option>
          <option value="在线">在线</option>
          <option value="离线">离线</option>
          <option value="警告">警告</option>
        </select>
        <select class="input-field" style="width: auto;" v-model="typeFilter">
          <option value="">所有类型</option>
          <option value="传感器">传感器</option>
          <option value="控制器">控制器</option>
          <option value="监控设备">监控设备</option>
          <option value="取暖设备">取暖设备</option>
          <option value="安全设备">安全设备</option>
        </select>
        <input type="text" class="input-field" placeholder="搜索设备..." style="width: 300px;" v-model="searchQuery" />
      </div>
    </div>

    <!-- 档案管理部分 -->
    <div class="equipment-table card">
      <div class="table-header">
        <h3>设备档案管理</h3>
        <div class="table-actions">
          <button class="btn btn-primary" @click="showAddEquipmentModal = true">添加档案</button>
          <button class="btn btn-secondary">刷新</button>
        </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>设备ID</th>
            <th>设备名称</th>
            <th>类型</th>
            <th>位置</th>
            <th>责任人</th>
            <th>联系电话</th>
            <th>状态</th>
            <th>最后更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in filteredDevices" :key="device.id">
            <td>{{ device.id }}</td>
            <td>{{ device.name }}</td>
            <td>{{ device.type }}</td>
            <td>{{ device.location }}</td>
            <td>{{ device.responsiblePerson }}</td>
            <td>{{ device.contactInfo }}</td>
            <td>
              <span :class="['status-badge', device.statusClass]">{{ device.statusText }}</span>
            </td>
            <td>{{ device.lastUpdate }}</td>
            <td>
              <!-- 删除了详情按钮，仅保留编辑按钮 -->
              <button class="btn btn-small btn-secondary" @click="openEditEquipmentModal(device)">编辑</button>
            </td>
          </tr>
          <tr v-if="filteredDevices.length === 0">
            <td colspan="9" class="empty-list">暂无设备数据，请添加设备档案</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 1. 添加设备弹窗 -->
    <div class="modal-overlay" v-if="showAddDeviceModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>添加设备</h3>
          <button class="modal-close" @click="showAddDeviceModal = false" >×</button>
        </div>
        <div class="modal-body">
          <form class="form-group" @submit.prevent="confirmAddDevice">
            <div class="form-item">
              <label>设备ID</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addDeviceForm.deviceId" 
                placeholder="请输入设备ID"
              />
              <span class="error-text" v-if="!addDeviceForm.deviceId && formSubmitted">设备ID不能为空</span>
            </div>
            <div class="form-item">
              <label>设备名称</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addDeviceForm.deviceName" 
                placeholder="请输入设备名称"
              />
              <span class="error-text" v-if="!addDeviceForm.deviceName && formSubmitted">设备名称不能为空</span>
            </div>
            <div class="form-item">
              <label>设备类型</label>
              <select class="input-field" v-model="addDeviceForm.deviceType">
                <option value="">请选择设备类型</option>
                <option value="取暖设备">取暖设备</option>
                <option value="安全设备">安全设备</option>
                <option value="监控设备">监控设备</option>
                <option value="传感器">传感器</option>
                <option value="控制器">控制器</option>
              </select>
              <span class="error-text" v-if="!addDeviceForm.deviceType && formSubmitted">请选择设备类型</span>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddDeviceModal = false">取消</button>
          <button class="btn btn-primary" @click="() => { formSubmitted = true; confirmAddDevice(); }">确认添加</button>
        </div>
      </div>
    </div>

    <!-- 添加机器人弹窗 -->
    <div class="modal-overlay" v-if="showAddRobotModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>添加机器人</h3>
          <button class="modal-close" @click="showAddRobotModal = false">×</button>
        </div>
        <div class="modal-body">
          <form class="form-group">
            <div class="form-item">
              <label>机器人ID</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addRobotForm.id" 
                placeholder="例如：R004"
              />
              <span class="error-text" v-if="!addRobotForm.id && robotFormSubmitted">机器人ID不能为空</span>
              <span class="error-text" v-if="robotIdExist && robotFormSubmitted">机器人ID已存在</span>
            </div>
            <div class="form-item">
              <label>机器人名称</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addRobotForm.name" 
                placeholder="请输入机器人名称"
              />
              <span class="error-text" v-if="!addRobotForm.name && robotFormSubmitted">机器人名称不能为空</span>
            </div>
            <div class="form-item">
              <label>初始状态</label>
              <select class="input-field" v-model="addRobotForm.status">
                <option value="在线">在线</option>
                <option value="离线">离线</option>
                <option value="巡检中">巡检中</option>
              </select>
            </div>
            <div class="form-item">
              <label>初始电量(%)</label>
              <input 
                type="number" 
                class="input-field" 
                v-model="addRobotForm.battery" 
                min="0" 
                max="100"
                placeholder="0-100"
              />
              <span class="error-text" v-if="(addRobotForm.battery < 0 || addRobotForm.battery > 100) && robotFormSubmitted">电量需在0-100之间</span>
            </div>
            <div class="form-item">
              <label>初始位置</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addRobotForm.location" 
                placeholder="例如：C栋三楼机房"
              />
              <span class="error-text" v-if="!addRobotForm.location && robotFormSubmitted">初始位置不能为空</span>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddRobotModal = false">取消</button>
          <button class="btn btn-primary" @click="() => { robotFormSubmitted = true; confirmAddRobot(); }">确认添加</button>
        </div>
      </div>
    </div>

    <!-- 3. 批量操作弹窗 -->
    <div class="modal-overlay" v-if="showBatchModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>批量操作</h3>
          <button class="modal-close" @click="showBatchModal = false">×</button>
        </div>
        <div class="modal-body">
          <button class="btn btn-primary" @click="showExcelImportModal = true">批量添加</button>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBatchModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- Excel导入弹窗 -->
    <div class="modal-overlay" v-if="showExcelImportModal">
      <div class="modal-card import-card">
        <div class="modal-header">
          <h3>批量导入设备</h3>
          <button class="modal-close" @click="showExcelImportModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="import-area" @drop="handleFileDrop" @dragover="handleDragOver" @dragleave="handleDragLeave" :class="{ dragOver: isDragOver }">
            <input 
              type="file" 
              ref="fileInput" 
              class="file-input" 
              accept=".xlsx,.xls" 
              @change="handleFileSelect"
            />
            <div class="import-hint">
              <i class="icon">📤</i>
              <p>将Excel文件拖拽至此，或</p>
              <button class="btn btn-primary" @click="triggerFileInput">选择文件</button>
            </div>
          </div>
          <div v-if="selectedFile" class="file-selected">
            已选择文件: {{ selectedFile.name }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showExcelImportModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmImportExcel" :disabled="!selectedFile">确认导入</button>
        </div>
      </div>
    </div>

    <!-- 添加巡检计划弹窗 -->
    <div class="modal-overlay" v-if="showAddPlanModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>添加巡检计划</h3>
          <button class="modal-close" @click="showAddPlanModal = false">×</button>
        </div>
        <div class="modal-body">
          <form class="form-group">
            <div class="form-item">
              <label>计划名称</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addPlanForm.name" 
                placeholder="请输入计划名称"
              />
              <span class="error-text" v-if="!addPlanForm.name && planFormSubmitted">计划名称不能为空</span>
            </div>
            <div class="form-item">
              <label>执行时间</label>
              <input 
                type="time" 
                class="input-field" 
                v-model="addPlanForm.time" 
                placeholder="请选择执行时间"
              />
              <span class="error-text" v-if="!addPlanForm.time && planFormSubmitted">请选择执行时间</span>
            </div>
            <div class="form-item">
              <label>周期</label>
              <select class="input-field" v-model="addPlanForm.cycle">
                <option value="">请选择周期</option>
                <option value="每天">每天</option>
                <option value="工作日">工作日</option>
                <option value="周末">周末</option>
                <option value="每周">每周</option>
                <option value="每月">每月</option>
              </select>
              <span class="error-text" v-if="!addPlanForm.cycle && planFormSubmitted">请选择周期</span>
            </div>
            <div class="form-item">
              <label>关联机器人</label>
              <select class="input-field" v-model="addPlanForm.assignedRobot">
                <option value="">请选择机器人</option>
                <option v-for="robot in robots" :key="robot.id" :value="robot.id">{{ robot.name }} ({{ robot.id }})</option>
              </select>
              <span class="error-text" v-if="!addPlanForm.assignedRobot && planFormSubmitted">请选择关联机器人</span>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddPlanModal = false">取消</button>
          <button class="btn btn-primary" @click="() => { planFormSubmitted = true; confirmAddPlan(); }">确认添加</button>
        </div>
      </div>
    </div>

    <!-- 编辑巡检计划弹窗 -->
    <div class="modal-overlay" v-if="showEditPlanModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>编辑巡检计划</h3>
          <button class="modal-close" @click="showEditPlanModal = false">×</button>
        </div>
        <div class="modal-body">
          <form class="form-group" v-if="currentEditPlan">
            <div class="form-item">
              <label>计划名称</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="editPlanForm.name" 
                placeholder="请输入计划名称"
              />
              <span class="error-text" v-if="!editPlanForm.name && editPlanSubmitted">计划名称不能为空</span>
            </div>
            <div class="form-item">
              <label>执行时间</label>
              <input 
                type="time" 
                class="input-field" 
                v-model="editPlanForm.time" 
                placeholder="请选择执行时间"
              />
              <span class="error-text" v-if="!editPlanForm.time && editPlanSubmitted">请选择执行时间</span>
            </div>
            <div class="form-item">
              <label>周期</label>
              <select class="input-field" v-model="editPlanForm.cycle">
                <option value="">请选择周期</option>
                <option value="每天">每天</option>
                <option value="工作日">工作日</option>
                <option value="周末">周末</option>
                <option value="每周">每周</option>
                <option value="每月">每月</option>
              </select>
              <span class="error-text" v-if="!editPlanForm.cycle && editPlanSubmitted">请选择周期</span>
            </div>
            <div class="form-item">
              <label>关联机器人</label>
              <select class="input-field" v-model="editPlanForm.assignedRobot">
                <option value="">请选择机器人</option>
                <option v-for="robot in robots" :key="robot.id" :value="robot.id">{{ robot.name }} ({{ robot.id }})</option>
              </select>
              <span class="error-text" v-if="!editPlanForm.assignedRobot && editPlanSubmitted">请选择关联机器人</span>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditPlanModal = false">取消</button>
          <button class="btn btn-primary" @click="() => { editPlanSubmitted = true; confirmEditPlan(); }">确认修改</button>
        </div>
      </div>
    </div>

    <!-- 添加设备档案弹窗 -->
    <div class="modal-overlay" v-if="showAddEquipmentModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>添加设备档案</h3>
          <button class="modal-close" @click="showAddEquipmentModal = false">×</button>
        </div>
        <div class="modal-body">
          <form class="form-group">
            <div class="form-item">
              <label>设备ID</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addEquipmentForm.id" 
                placeholder="请输入设备ID"
                required
              />
              <span class="error-text" v-if="!addEquipmentForm.id && equipmentFormSubmitted">设备ID不能为空</span>
              <span class="error-text" v-if="equipmentIdExist && equipmentFormSubmitted">设备ID已存在</span>
            </div>
            <div class="form-item">
              <label>设备名称</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addEquipmentForm.name" 
                placeholder="请输入设备名称"
                required
              />
              <span class="error-text" v-if="!addEquipmentForm.name && equipmentFormSubmitted">设备名称不能为空</span>
            </div>
            <div class="form-item">
              <label>类型</label>
              <select class="input-field" v-model="addEquipmentForm.type" required>
                <option value="">请选择设备类型</option>
                <option value="取暖设备">取暖设备</option>
                <option value="安全设备">安全设备</option>
                <option value="监控设备">监控设备</option>
                <option value="传感器">传感器</option>
                <option value="控制器">控制器</option>
              </select>
              <span class="error-text" v-if="!addEquipmentForm.type && equipmentFormSubmitted">请选择设备类型</span>
            </div>
            <div class="form-item">
              <label>位置</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addEquipmentForm.location" 
                placeholder="请输入设备位置"
                required
              />
              <span class="error-text" v-if="!addEquipmentForm.location && equipmentFormSubmitted">设备位置不能为空</span>
            </div>
            <div class="form-item">
              <label>责任人</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="addEquipmentForm.responsiblePerson" 
                placeholder="请输入责任人"
                required
              />
              <span class="error-text" v-if="!addEquipmentForm.responsiblePerson && equipmentFormSubmitted">责任人不能为空</span>
            </div>
            <div class="form-item">
              <label>联系电话</label>
              <input 
                type="tel" 
                class="input-field" 
                v-model="addEquipmentForm.contactInfo" 
                placeholder="请输入联系电话"
                required
              />
              <span class="error-text" v-if="!addEquipmentForm.contactInfo && equipmentFormSubmitted">联系电话不能为空</span>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddEquipmentModal = false">取消</button>
          <button class="btn btn-primary" @click="() => { equipmentFormSubmitted = true; confirmAddEquipment(); }">确认添加</button>
        </div>
      </div>
    </div>

    <!-- 编辑设备档案弹窗（核心修改） -->
    <div class="modal-overlay" v-if="showEditEquipmentModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>编辑设备档案</h3>
          <button class="modal-close" @click="showEditEquipmentModal = false">×</button>
        </div>
        <div class="modal-body" v-if="currentEditDevice">
          <form class="form-group">
            <!-- 设备ID（只读） -->
            <div class="form-item">
              <label>设备ID</label>
              <input 
                type="text" 
                class="input-field input-readonly" 
                :value="currentEditDevice.id" 
                readonly
              />
            </div>
            <!-- 设备名称（只读） -->
            <div class="form-item">
              <label>设备名称</label>
              <input 
                type="text" 
                class="input-field input-readonly" 
                :value="currentEditDevice.name" 
                readonly
              />
            </div>
            <!-- 设备类型（只读） -->
            <div class="form-item">
              <label>类型</label>
              <input 
                type="text" 
                class="input-field input-readonly" 
                :value="currentEditDevice.type" 
                readonly
              />
            </div>
            <!-- 位置（可编辑） -->
            <div class="form-item">
              <label>位置</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="editEquipmentForm.location" 
                placeholder="请输入设备位置"
                required
              />
              <span class="error-text" v-if="!editEquipmentForm.location && editEquipmentSubmitted">设备位置不能为空</span>
            </div>
            <!-- 责任人（可编辑） -->
            <div class="form-item">
              <label>责任人</label>
              <input 
                type="text" 
                class="input-field" 
                v-model="editEquipmentForm.responsiblePerson" 
                placeholder="请输入责任人"
                required
              />
              <span class="error-text" v-if="!editEquipmentForm.responsiblePerson && editEquipmentSubmitted">责任人不能为空</span>
            </div>
            <!-- 联系电话（可编辑） -->
            <div class="form-item">
              <label>联系电话</label>
              <input 
                type="tel" 
                class="input-field" 
                v-model="editEquipmentForm.contactInfo" 
                placeholder="请输入联系电话"
                required
              />
              <span class="error-text" v-if="!editEquipmentForm.contactInfo && editEquipmentSubmitted">联系电话不能为空</span>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditEquipmentModal = false">取消</button>
          <button class="btn btn-primary" @click="() => { editEquipmentSubmitted = true; confirmEditEquipment(); }">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// 1. 导入axios并配置基础URL
import axios from 'axios';

// 核心修改1：修正后端接口基础地址（用户指定的192.168.1.116:3002/robots）
const API_BASE_URL = 'http://192.168.1.116:3002/robots';

// 核心修改2：封装适配GET请求的机器人数据交互方法（JSON参数通过params传递）
/**
 * 向后端同步机器人数据（GET请求，JSON参数通过params传递）
 * @param {Object} data 机器人数据（含id/name/status/battery/location/command等）
 * @returns {Promise} 请求Promise
 */
const fetchRobotData = async (data) => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: data, // GET请求的JSON参数通过params传递，后端可解析
      headers: {
        'Content-Type': 'application/json' // 声明参数为JSON格式
      },
      timeout: 5000 // 设置5秒超时，避免请求阻塞
    });
    return response.data;
  } catch (error) {
    console.error('机器人数据同步至后端失败:', error);
    // 分级友好错误提示，方便问题排查
    if (error.response) {
      alert(`接口请求失败：${error.response.status} - ${error.response.data?.message || '后端处理错误'}`);
    } else if (error.request) {
      alert('网络错误：无法连接到后端服务器，请检查网络或服务器状态');
    } else {
      alert(`请求初始化错误：${error.message}`);
    }
    throw error; // 抛出错误供上层处理（如回滚本地数据）
  }
};

// 机器人数据（初始数据 + 新增数据都会存在这里）
const robots = ref([
  {
    id: 'R001',
    name: '巡检机器人一号',
    status: '巡检中',
    statusClass: 'status-active',
    battery: 78,
    location: 'A栋一楼大厅'
  },
  {
    id: 'R002',
    name: '巡检机器人二号',
    status: '在线',
    statusClass: 'status-active',
    battery: 95,
    location: 'B栋二楼'
  },
  {
    id: 'R003',
    name: '巡检机器人三号',
    status: '离线',
    statusClass: 'status-inactive',
    battery: 32,
    location: '充电站'
  }
]);

// 巡检计划数据
const inspectionPlans = ref([
  {
    id: 1,
    name: '日常办公区巡检',
    time: '18:00',
    cycle: '每天',
    assignedRobot: 'R001',
    enabled: true
  },
  {
    id: 2,
    name: '夜间安全巡检',
    time: '22:00',
    cycle: '工作日',
    assignedRobot: 'R002',
    enabled: true
  },
  {
    id: 3,
    name: '周末设备检查',
    time: '10:00',
    cycle: '周末',
    assignedRobot: 'R003',
    enabled: false
  }
]);

// 设备数据
const devices = ref([
  {
    id: '#D001',
    name: '取暖器A001',
    type: '取暖设备',
    location: 'A栋-1楼-大厅',
    responsiblePerson: '张三',
    contactInfo: '13800138001',
    statusText: '在线',
    statusClass: 'status-active',
    lastUpdate: '5分钟前'
  },
  {
    id: '#D002',
    name: '取暖器B001',
    type: '取暖设备',
    location: 'B栋-2楼-会议室',
    responsiblePerson: '李四',
    contactInfo: '13800138002',
    statusText: '在线',
    statusClass: 'status-active',
    lastUpdate: '15分钟前'
  },
  {
    id: '#D003',
    name: '门禁系统',
    type: '安全设备',
    location: 'C栋-1楼-入口',
    responsiblePerson: '王五',
    contactInfo: '13800138003',
    statusText: '警告',
    statusClass: 'status-warning',
    lastUpdate: '1小时前'
  },
  {
    id: '#D004',
    name: '烟雾探测器',
    type: '安全设备',
    location: 'D栋-3楼-仓库',
    responsiblePerson: '赵六',
    contactInfo: '13800138004',
    statusText: '离线',
    statusClass: 'status-inactive',
    lastUpdate: '2小时前'
  },
  {
    id: '#D005',
    name: '摄像头',
    type: '监控设备',
    location: 'E栋-1楼-前台',
    responsiblePerson: '钱七',
    contactInfo: '13800138005',
    statusText: '在线',
    statusClass: 'status-active',
    lastUpdate: '3小时前'
  },
  {
    id: '#D006',
    name: '取暖器F001',
    type: '取暖设备',
    location: 'F栋-地下室-泵房',
    responsiblePerson: '孙八',
    contactInfo: '13800138006',
    statusText: '在线',
    statusClass: 'status-active',
    lastUpdate: '4小时前'
  }
]);

// 过滤条件
const statusFilter = ref('');
const typeFilter = ref('');
const searchQuery = ref('');

// 计算属性：过滤设备数据
const filteredDevices = computed(() => {
  return devices.value.filter(device => {
    const matchesStatus = !statusFilter.value || device.statusText === statusFilter.value;
    const matchesType = !typeFilter.value || device.type.includes(typeFilter.value);
    const matchesSearch = !searchQuery.value || 
      device.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      device.id.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });
});

// 弹窗控制
const showAddDeviceModal = ref(false);
const showBatchModal = ref(false);
const showExcelImportModal = ref(false);
const showAddPlanModal = ref(false);
const showEditPlanModal = ref(false);
const showAddRobotModal = ref(false);
// 设备档案弹窗控制
const showAddEquipmentModal = ref(false);
const showEditEquipmentModal = ref(false);

// 添加设备表单
const addDeviceForm = ref({
  deviceId: '',
  deviceName: '',
  deviceType: ''
});

// 添加机器人表单
const addRobotForm = ref({
  id: '',
  name: '',
  status: '在线', // 默认状态
  battery: 100,  // 默认电量
  location: ''
});

// 添加计划表单
const addPlanForm = ref({
  name: '',
  time: '',
  cycle: '',
  assignedRobot: ''
});

// 编辑计划相关
const currentEditPlan = ref(null);
const editPlanForm = ref({
  name: '',
  time: '',
  cycle: '',
  assignedRobot: ''
});

// 添加设备档案表单
const addEquipmentForm = ref({
  id: '',
  name: '',
  type: '',
  location: '',
  responsiblePerson: '',
  contactInfo: ''
});

// 编辑设备档案相关
const currentEditDevice = ref(null);
const editEquipmentForm = ref({
  location: '',
  responsiblePerson: '',
  contactInfo: ''
});

// Excel导入相关
const fileInput = ref(null);
const selectedFile = ref(null);
const isDragOver = ref(false);

// 表单提交状态（用于内联校验）
const formSubmitted = ref(false);
const robotFormSubmitted = ref(false);
const planFormSubmitted = ref(false);
const editPlanSubmitted = ref(false);
const equipmentFormSubmitted = ref(false);
const editEquipmentSubmitted = ref(false);

// 计算属性 - 检查机器人ID是否存在
const robotIdExist = computed(() => {
  return robots.value.some(robot => robot.id === addRobotForm.value.id);
});

// 计算属性 - 检查设备ID是否存在
const equipmentIdExist = computed(() => {
  return devices.value.some(device => device.id === addEquipmentForm.value.id);
});

// 根据机器人ID获取名称
const getRobotNameById = (robotId) => {
  const robot = robots.value.find(r => r.id === robotId);
  return robot ? `${robot.name} (${robot.id})` : '未关联';
};

// 机器人指令处理：批量发送指令
const sendCommand = (command) => {
  alert(`已向所有机器人发送指令: ${command}`);
  // 批量发送所有机器人的指令数据到后端
  robots.value.forEach(robot => {
    sendRobotCommand(robot.id, command);
  });
};

// 核心修改3：发送单个机器人指令时，同步数据至后端接口
const sendRobotCommand = async (robotId, command) => {
  alert(`已向机器人 ${robotId} 发送指令: ${command}`);
  
  // 更新机器人状态
  const robotIndex = robots.value.findIndex(r => r.id === robotId);
  if (robotIndex !== -1) {
    let status = '';
    let statusClass = '';
    let battery = robots.value[robotIndex].battery; // 保留原电量
    let location = robots.value[robotIndex].location; // 保留原位置
    
    switch(command) {
      case 'start':
        status = '巡检中';
        statusClass = 'status-warning';
        battery = Math.max(0, battery - 5); // 巡检开始消耗5%电量
        break;
      case 'stop':
        status = '在线';
        statusClass = 'status-active';
        break;
      case 'return':
        status = '离线';
        statusClass = 'status-inactive';
        location = '充电站';
        battery = 100; // 返回充电后电量满格
        break;
    }
    
    // 构建要同步的机器人数据
    const robotSyncData = {
      id: robotId,
      name: robots.value[robotIndex].name,
      status: status,
      battery: battery,
      location: location,
      command: command // 记录发送的指令，供后端处理
    };

    try {
      // 调用后端接口，同步指令后的机器人数据
      await fetchRobotData(robotSyncData);
      // 接口调用成功后，再更新本地数据（保证数据一致性）
      robots.value[robotIndex].status = status;
      robots.value[robotIndex].statusClass = statusClass;
      robots.value[robotIndex].battery = battery;
      robots.value[robotIndex].location = location;
      console.log(`机器人${robotId}指令执行成功，数据已同步至后端`);
    } catch (error) {
      console.error(`机器人${robotId}指令执行失败，数据同步后端出错`, error);
      alert(`机器人${robotId}指令执行失败：后端数据同步出错，请重试`);
    }
  }
};

// 打开编辑计划弹窗（从机器人列表点击）
const openEditPlan = (robotId) => {
  const relatedPlan = inspectionPlans.value.find(plan => plan.assignedRobot === robotId);
  if (relatedPlan) {
    openEditPlanModal(relatedPlan);
  } else {
    addPlanForm.value.assignedRobot = robotId;
    showAddPlanModal.value = true;
  }
};

// 打开编辑计划弹窗（从计划列表点击）
const openEditPlanModal = (plan) => {
  currentEditPlan.value = plan;
  editPlanForm.value = {
    name: plan.name,
    time: plan.time,
    cycle: plan.cycle,
    assignedRobot: plan.assignedRobot
  };
  showEditPlanModal.value = true;
};

// 确认添加设备
const confirmAddDevice = () => {
  // 重置提交状态
  formSubmitted.value = true;
  
  if (!addDeviceForm.value.deviceId || !addDeviceForm.value.deviceName || !addDeviceForm.value.deviceType) {
    return;
  }
  
  const newDevice = {
    id: addDeviceForm.value.deviceId,
    name: addDeviceForm.value.deviceName,
    type: addDeviceForm.value.deviceType,
    location: '未分配',
    responsiblePerson: '未分配',
    contactInfo: '未填写',
    statusText: '离线',
    statusClass: 'status-inactive',
    lastUpdate: '刚刚'
  };
  
  devices.value.push(newDevice);
  alert(`设备 ${addDeviceForm.value.deviceName} 添加成功！`);
  
  // 重置表单和提交状态
  addDeviceForm.value = { deviceId: '', deviceName: '', deviceType: '' };
  formSubmitted.value = false;
  showAddDeviceModal.value = false;
};

// 核心修改4：添加机器人时，先同步后端接口，再更新本地数据
const confirmAddRobot = async () => {
  // 重置提交状态
  robotFormSubmitted.value = true;
  
  // 表单校验
  if (!addRobotForm.value.id || !addRobotForm.value.name || !addRobotForm.value.location) {
    return;
  }
  if (robotIdExist.value) return; // 检查ID是否重复
  if (addRobotForm.value.battery < 0 || addRobotForm.value.battery > 100) return; // 检查电量范围
  
  // 根据状态匹配对应的样式类
  const getStatusClass = (status) => {
    switch(status) {
      case '在线': return 'status-active';
      case '离线': return 'status-inactive';
      case '巡检中': return 'status-warning';
      default: return 'status-active';
    }
  };
  
  // 构建新机器人数据
  const newRobot = {
    id: addRobotForm.value.id,
    name: addRobotForm.value.name,
    status: addRobotForm.value.status,
    statusClass: getStatusClass(addRobotForm.value.status),
    battery: addRobotForm.value.battery,
    location: addRobotForm.value.location
  };

  // 构建同步后端的机器人数据（含添加操作标记）
  const robotSyncData = {
    ...newRobot,
    command: 'add' // 标记为添加机器人操作，供后端识别
  };
  
  try {
    // 第一步：调用后端接口，同步新机器人数据
    await fetchRobotData(robotSyncData);
    // 第二步：接口成功后，再添加到本地列表（保证本地与后端数据一致）
    robots.value.push(newRobot);
    alert(`机器人 ${addRobotForm.value.name} 添加成功！`);
    
    // 重置表单、提交状态并关闭弹窗
    addRobotForm.value = {
      id: '',
      name: '',
      status: '在线',
      battery: 100,
      location: ''
    };
    robotFormSubmitted.value = false;
    showAddRobotModal.value = false;
  } catch (error) {
    console.error('添加机器人失败：后端数据同步出错', error);
    alert('添加机器人失败：无法将数据同步至后端，请检查服务器或重试');
  }
};

// 确认添加巡检计划
const confirmAddPlan = () => {
  // 重置提交状态
  planFormSubmitted.value = true;
  
  if (!addPlanForm.value.name || !addPlanForm.value.time || !addPlanForm.value.cycle || !addPlanForm.value.assignedRobot) {
    return;
  }
  
  const newPlan = {
    id: inspectionPlans.value.length + 1,
    name: addPlanForm.value.name,
    time: addPlanForm.value.time,
    cycle: addPlanForm.value.cycle,
    assignedRobot: addPlanForm.value.assignedRobot,
    enabled: true
  };
  
  inspectionPlans.value.push(newPlan);
  alert(`巡检计划 ${addPlanForm.value.name} 添加成功！`);
  
  // 重置表单和提交状态
  addPlanForm.value = { name: '', time: '', cycle: '', assignedRobot: '' };
  planFormSubmitted.value = false;
  showAddPlanModal.value = false;
};

// 确认编辑巡检计划
const confirmEditPlan = () => {
  // 重置提交状态
  editPlanSubmitted.value = true;
  
  if (!editPlanForm.value.name || !editPlanForm.value.time || !editPlanForm.value.cycle || !editPlanForm.value.assignedRobot) {
    return;
  }
  
  const index = inspectionPlans.value.findIndex(plan => plan.id === currentEditPlan.value.id);
  if (index !== -1) {
    inspectionPlans.value[index] = {
      ...inspectionPlans.value[index],
      name: editPlanForm.value.name,
      time: editPlanForm.value.time,
      cycle: editPlanForm.value.cycle,
      assignedRobot: editPlanForm.value.assignedRobot
    };
    
    alert(`巡检计划 ${editPlanForm.value.name} 修改成功！`);
    showEditPlanModal.value = false;
    currentEditPlan.value = null;
    editPlanSubmitted.value = false;
  }
};

// 删除计划
const deletePlan = (planId) => {
  if (confirm('确定要删除此巡检计划吗？')) {
    const index = inspectionPlans.value.findIndex(p => p.id === planId);
    if (index !== -1) {
      inspectionPlans.value.splice(index, 1);
    }
  }
};

// Excel导入相关方法
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleFileDrop = (e) => {
  e.preventDefault();
  isDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    selectedFile.value = file;
  } else {
    alert('请上传Excel文件（.xlsx/.xls）！');
  }
};

const confirmImportExcel = () => {
  if (confirm(`确认导入文件 ${selectedFile.value.name} 吗？`)) {
    // 模拟导入成功后添加示例数据
    const mockDevices = [
      {
        id: '#D007',
        name: '温湿度传感器',
        type: '传感器',
        location: 'G栋-1楼-机房',
        responsiblePerson: '周九',
        contactInfo: '13800138007',
        statusText: '在线',
        statusClass: 'status-active',
        lastUpdate: '刚刚'
      },
      {
        id: '#D008',
        name: '消防控制器',
        type: '控制器',
        location: 'H栋-2楼-消防室',
        responsiblePerson: '吴十',
        contactInfo: '13800138008',
        statusText: '在线',
        statusClass: 'status-active',
        lastUpdate: '刚刚'
      }
    ];
    
    devices.value.push(...mockDevices);
    
    alert(`文件 ${selectedFile.value.name} 导入成功！新增${mockDevices.length}个设备`);
    selectedFile.value = null;
    showExcelImportModal.value = false;
    showBatchModal.value = false;
  }
};

// 打开编辑设备档案弹窗
const openEditEquipmentModal = (device) => {
  currentEditDevice.value = device;
  // 仅初始化可编辑字段
  editEquipmentForm.value = {
    location: device.location,
    responsiblePerson: device.responsiblePerson,
    contactInfo: device.contactInfo
  };
  showEditEquipmentModal.value = true;
};

// 确认添加设备档案
const confirmAddEquipment = () => {
  // 重置提交状态
  equipmentFormSubmitted.value = true;
  
  // 表单校验
  if (!addEquipmentForm.value.id || !addEquipmentForm.value.name || !addEquipmentForm.value.type ||
      !addEquipmentForm.value.location || !addEquipmentForm.value.responsiblePerson || !addEquipmentForm.value.contactInfo) {
    return;
  }
  
  // 检查设备ID是否重复
  if (equipmentIdExist.value) {
    return;
  }
  
  // 构建新设备档案数据
  const newEquipment = {
    id: addEquipmentForm.value.id,
    name: addEquipmentForm.value.name,
    type: addEquipmentForm.value.type,
    location: addEquipmentForm.value.location,
    responsiblePerson: addEquipmentForm.value.responsiblePerson,
    contactInfo: addEquipmentForm.value.contactInfo,
    statusText: '在线',
    statusClass: 'status-active',
    lastUpdate: '刚刚'
  };
  
  // 添加到设备列表
  devices.value.push(newEquipment);
  alert(`设备档案 ${addEquipmentForm.value.name} 添加成功！`);
  
  // 重置表单、提交状态并关闭弹窗
  addEquipmentForm.value = {
    id: '',
    name: '',
    type: '',
    location: '',
    responsiblePerson: '',
    contactInfo: ''
  };
  equipmentFormSubmitted.value = false;
  showAddEquipmentModal.value = false;
};

// 确认编辑设备档案
const confirmEditEquipment = () => {
  // 重置提交状态
  editEquipmentSubmitted.value = true;
  
  // 表单校验（仅校验可编辑字段）
  if (!editEquipmentForm.value.location || !editEquipmentForm.value.responsiblePerson || !editEquipmentForm.value.contactInfo) {
    return;
  }
  
  // 查找并更新设备数据
  const index = devices.value.findIndex(device => device.id === currentEditDevice.value.id);
  if (index !== -1) {
    devices.value[index] = {
      ...devices.value[index], // 保留原有不可修改字段
      location: editEquipmentForm.value.location,
      responsiblePerson: editEquipmentForm.value.responsiblePerson,
      contactInfo: editEquipmentForm.value.contactInfo,
      lastUpdate: '刚刚' // 更新最后修改时间
    };
    
    alert('设备档案修改成功！');
    showEditEquipmentModal.value = false;
    currentEditDevice.value = null;
    editEquipmentSubmitted.value = false;
  }
};
</script>

<style scoped>
.equipment-management {
  padding: 0 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
}

/* 卡片样式 */
.card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 1.8rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.header-content .subtitle {
  color: #7f8c8d;
  margin-top: 8px;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.filters-section {
  padding: 20px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.equipment-table {
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 10px;
}

/* 按钮样式 */
.btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.btn:hover {
  background: #2980b9;
}

.btn-primary {
  background: #3498db;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-warning {
  background: #f39c12;
}

.btn-warning:hover {
  background: #e67e22;
}

.btn-secondary {
  background: #95a5a6;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
  margin-right: 5px;
}

/* 状态徽章样式 */
.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.status-active {
  background: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

.status-badge.status-warning {
  background: rgba(241, 196, 15, 0.2);
  color: #f39c12;
}

.status-badge.status-inactive {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

/* 机器人管理部分 */
.robot-management {
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.section-header h3 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin: 0;
}

.robot-actions {
  display: flex;
  gap: 10px;
}

/* 机器人列表样式 */
.robot-list-section {
  margin-top: 20px;
}

.robot-list-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 15px;
  font-weight: 600;
}

.robot-list {
  width: 100%;
}

/* 空列表提示 */
.empty-list {
  text-align: center;
  padding: 30px;
  color: #7f8c8d;
  font-size: 0.95rem;
  background-color: #f8f9fa;
}

/* 巡检计划部分 */
.inspection-plans {
  padding: 20px;
  margin-bottom: 20px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0 8px;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 表单样式 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

/* 错误提示 */
.error-text {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 4px;
}

/* 只读输入框样式 */
.input-readonly {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #e9ecef;
}

/* Excel导入样式 */
.import-card {
  max-width: 600px;
}

.import-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 15px;
  transition: border-color 0.3s, background-color 0.3s;
}

.import-area.dragOver {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.file-input {
  display: none;
}

.import-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #7f8c8d;
}

.import-hint .icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.file-selected {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  color: #2c3e50;
  font-size: 0.95rem;
}

/* 表格样式 */
.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.table th, .table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 0.95rem;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.table tr:hover {
  background-color: #f8f9fa;
}

/* 响应式样式 */
@media (max-width: 992px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .header-actions {
    align-self: stretch;
    justify-content: center;
    flex-wrap: wrap;
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
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .robot-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-controls .input-field {
    width: 100% !important;
  }
  
  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .modal-card {
    width: 95%;
  }
  
  .btn {
    width: 100%;
  }
  
  .robot-actions, .header-actions, .table-actions {
    flex-direction: column;
  }
}
</style>