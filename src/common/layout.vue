<template>
  <a-layout>
    <a-layout-header class="layout-header">
      <a-menu v-model="current" mode="horizontal">
        <a-menu-item key="date">
          <a-icon type="schedule"/>排班表
        </a-menu-item>
        <a-menu-item key="self">
          <a-icon type="user"/>只看自己
        </a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout-content class="layout-content">
      <slot/>
    </a-layout-content>
  </a-layout>
</template>

<script>
export default {
  props: {
    current: {
      type: Array,
      default: () => ['date']
    }
  }
}
</script>

<style>
.layout-header {
  height: 48px !important;
  padding: 0 !important;
}

.layout-content {
  position: absolute;
  left: 0; right: 0;
  top: 48px; bottom: 0;
  padding: 1vh 1vw;
}
</style>

