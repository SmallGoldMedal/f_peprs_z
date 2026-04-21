<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <span>账号设置</span>
      </template>
      <div class="settings-actions">
        <ChangePassword />
        <CancelAccount />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import ChangePassword from './ChangePassword.vue'
import CancelAccount from './CancelAccount.vue'
</script>

<style scoped>
.settings-page {
  max-width: 600px;
  margin: 0 auto;
}
.settings-card {
  border-radius: 16px;
}
.settings-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 20px 0;
}
</style>