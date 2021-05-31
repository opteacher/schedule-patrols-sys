<template>
  <div>
    <div class="top-tabbar ptb-10">
      <a-button-group v-if="selTab === 'guard'" class="mr-8">
        <a-button @click="uploadDlg.visible = true">导入排班</a-button>
        <a-modal
          title="配置导入的排班Excel文件"
          :visible="uploadDlg.visible"
          @cancel="uploadDlg.visible = false"
        >
          <a-checkbox :checked="uploadDlg.isMergeCurrent"
            @change="uploadDlg.isMergeCurrent = arguments[0].target.checked"
          >
            是否合并到当前值班表？
          </a-checkbox>
          <a-checkbox class="ml-0" :checked="uploadDlg.isAutoGene"
            @change="uploadDlg.isAutoGene = arguments[0].target.checked"
          >
            是否自动生成街面勤务表？
          </a-checkbox>
          <template slot="footer">
            <a-button class="mr-8" @click="uploadDlg.visible = false">取消</a-button>
            <a-upload
              class="hide-upload"
              name="file"
              :showUploadList="false"
              :action="[
                bkdHost,
                '/schedule-patrols-sys',
                '/api/v1/guard/file/upload',
                `?isMergeCurrent=${uploadDlg.isMergeCurrent}`,
                `&isAutoGene=${uploadDlg.isAutoGene}`
              ].join('')"
              :multiple="true"
              accept=".xlsx,.xls"
              @change="onSelFileChanged"
            >
              <a-button type="primary">确定</a-button>
            </a-upload>
          </template>
        </a-modal>
      </a-button-group>
      <a-button-group class="mr-8"
        v-else-if="selTab === 'patrol' && dataTable.guard.data.length && dataTable.patrol.data.length"
      >
        <a-button @click="onGenePatrolClicked">再生成</a-button>
      </a-button-group>
      <a-button-group>
        <a-button @click="onTopTabClicked('guard')"
          :type="selTab === 'guard' ? 'primary' : 'default'"
        >排班表</a-button>
        <a-button @click="onTopTabClicked('patrol')"
          :type="selTab === 'patrol' ? 'primary' : 'default'"
        >勤务表</a-button>
        <a-button @click="onTopTabClicked('my')"
          :type="selTab === 'my' ? 'primary' : 'default'"
        >我的</a-button>
      </a-button-group>
    </div>
    <a-table
      :columns="dataTable[selTab].columns"
      :data-source="dataTable[selTab].data"
      :scroll="dataTable[selTab].scroll"
      :bordered="true"
      size="small"
      :pagination="false"
      :rowClassName="setTableRowCls"
      :loading="dataTable.loading"
    />
    <a-button v-if="selTab === 'guard' && dataTable.guard.data.length && !dataTable.patrol.data.length"
      class="btm-btn" type="primary" :loading="loadGenePatrol"
      :style="loadGenePatrol ? 'width: 90vw' : ''" @click="onGenePatrolClicked"
    >
      生成街面勤务安排
    </a-button>
    <a-button v-else-if="selTab === 'patrol' && dataTable.patrol.data.length"
      class="btm-btn" type="primary" @click="onExportClicked"
    >
      导出为Excel文件
    </a-button>
  </div>
</template>

<script>
import $ from 'jquery'
import axios from 'axios'
import utils from '../common/utils'
export default {
  name: 'Schedule',
  data () {
    return {
      bkdHost: 'http://127.0.0.1:4000',
      selTab: 'patrol',
      dataTable: {
        loading: false,
        guard: {
          columns: [],
          data: [],
          scroll: {x: 0, y: 0}
        },
        patrol: {
          columns: [],
          data: [],
          scroll: {x: 0, y: 0}
        },
        my: {
          columns: [],
          data: [],
          scroll: {x: 0, y: 0}
        }
      },
      uploadDlg: {
        visible: false,
        isMergeCurrent: true,
        isAutoGene: false
      },
      loadGenePatrol: false
    }
  },
  async created () {
    await this._reqBackend('guard')
    await this._reqBackend('patrol')
    await this._fixTbodyHeight()
  },
  methods: {
    async onSelFileChanged (e) {
      if (e.file.response) {
        const result = e.file.response.result
        this.dataTable.guard = result.guard
        this.dataTable.patrol = result.patrol || {
          columns: [],
          data: [],
          scroll: {x: 0, y: 0}
        }
        if (this.uploadDlg.isAutoGene) {
          this.onTopTabClicked('patrol')
          this.$message.success('生成成功！')
        } else {
          this.$message.success('导入成功！')
        }
        await this._fixTbodyHeight()
      }
      this.uploadDlg.visible = false
    },
    setTableRowCls (record, index) {
      return index % 2 ? '' : 'light-grey-bkgd'
    },
    async _reqBackend (symbol) {
      if (symbol === 'my') {
        return
      }
      this.dataTable.loading = true
      const url = `${this.bkdHost}/schedule-patrols-sys/mdl/v1/${symbol}s`
      const resp = await axios.get(url, {
        params: {month: (new Date()).getMonth() + 1}
      })
      this.dataTable[symbol] = resp.data.data[0] || {
        columns: [],
        data: [],
        scroll: {x: 0, y: 0}
      }
      this.dataTable.loading = false
    },
    onGenePatrolClicked () {
      const self = this
      this.$confirm({
        title: '确认生成巡逻勤务表？',
        content: '会覆盖原表！',
        onOk () {
          self._genePatrols()
        }
      })
    },
    async _genePatrols () {
      const self = this
      this.loadGenePatrol = true
      const resp = await axios.post(
        `${this.bkdHost}/schedule-patrols-sys/api/v1/patrol/gene`
      )
      this.loadGenePatrol = false
      this.dataTable.patrol = resp.data.result || {
        columns: [],
        data: [],
        scroll: {x: 0, y: 0}
      }
      this.$success({
        title: '操作成功！',
        content: <div><p>已为当前月生成新的巡逻班表</p></div>,
        onOk() {
          self.onTopTabClicked('patrol')
        }
      })
    },
    async onTopTabClicked (tab) {
      this.selTab = tab
      await this._reqBackend(tab)
      await this._fixTbodyHeight()
    },
    async _fixTbodyHeight () {
      let tbodyHeight = $('#app').height()
      tbodyHeight -= $('.top-tabbar').height() + 20
      const btmBtn = await utils.$For('.btm-btn', ele => ele[0].innerText, 10)
      if (btmBtn.length) {
        tbodyHeight -= btmBtn.height() + 13
      }
      const thead = await utils.$For('.ant-table-thead', ele => ele[0].innerText)
      tbodyHeight -= thead.height()
      const tbody = await utils.$For('.ant-table-body', ele => ele[0].innerText)
      tbody.css('max-height', `${tbodyHeight}px`)
      const tbodyInner = await utils.$For('.ant-table-body-inner', ele => ele[0].innerText)
      tbodyInner.css('max-height', `${tbodyHeight}px`)
    },
    onExportClicked () {
      const self = this
      this.$confirm({
        content: '确定导出为Excel文件？',
        async onOk() {
          const resp = await axios.get(
            `${self.bkdHost}/schedule-patrols-sys/api/v1/patrol/export/excel`
          )
          if (!resp.data.result) {
            self.$error({
              title: '导出Excel发生错误！',
              content: `错误详情：${resp.data.error || ''}`,
            })
          } else {
            self.$message.success('导出成功！')
            window.location.href = `${self.bkdHost}/${resp.data.result}`
          }
        }
      })
    }
  }
}
</script>

<style>
.scroll-table {
  position: absolute;
  left: 0;
  right: 0;
  top: 52px;
  bottom: 40px;
}
</style>
