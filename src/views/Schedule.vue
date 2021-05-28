<template>
  <div>
    <div class="top-tabbar ptb-10">
      <a-button-group v-if="selTab === 'guard'" class="mr-8">
        <a-button @click="loadDlg.visible = true">导入排班</a-button>
        <a-modal
          title="配置导入的排班Excel文件"
          :visible="loadDlg.visible"
          :confirm-loading="loadDlg.cfmLoading"
          @ok="onCfmUpldSubmited"
          @cancel="loadDlg.visible = false"
        >
          <a-checkbox :checked="loadDlg.isMergeCurrent"
            @change="loadDlg.isMergeCurrent = arguments[0].target.checked"
          >
            是否合并到当前值班表？
          </a-checkbox>
          <a-checkbox class="ml-0" :checked="loadDlg.isAutoGene"
            @change="loadDlg.isAutoGene = arguments[0].target.checked"
          >
            是否自动生成街面勤务表？
          </a-checkbox>
        </a-modal>
      </a-button-group>
      <a-button-group v-else-if="selTab === 'patrol'" class="mr-8">
        <a-button @click="onGenePatrolClicked">再生成</a-button>
      </a-button-group>
      <a-upload
        class="hide-upload"
        style="display: none"
        name="file"
        :action="[
          'http://127.0.0.1:4000',
          '/schedule-patrols-sys',
          '/api/v1/guard/file/upload',
          `?isMergeCurrent=${loadDlg.isMergeCurrent}`,
          `&isAutoGene=${loadDlg.isAutoGene}`
        ].join('')"
        :multiple="true"
        accept=".xlsx,.xls"
        @change="onSelFileChanged"
      />
      <a-button-group>
        <a-button
          :type="selTab === 'guard' ? 'primary' : 'default'"
          @click="onTopTabClicked('guard')"
        >排班表</a-button>
        <a-button
          :type="selTab === 'patrol' ? 'primary' : 'default'"
          @click="onTopTabClicked('patrol')"
        >勤务表</a-button>
        <a-button
          :type="selTab === 'my' ? 'primary' : 'default'"
          @click="onTopTabClicked('my')"
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
    >
      <span slot="date" slot-scope="text, record">
        {{record.date}}<br/>{{record.week}}
      </span>
    </a-table>
    <a-button v-if="selTab === 'guard' && dataTable.guard.data.length"
      class="btm-btn" type="primary" :loading="loadGenePatrol" @click="onGenePatrolClicked"
    >
      生成街面勤务安排
    </a-button>
    <a-button v-else-if="selTab === 'patrol' && dataTable.patrol.data.length" class="btm-btn" type="primary">
      导出为Excel文件
    </a-button>
  </div>
</template>

<script>
import $ from 'jquery'
import utils from '../common/utils'
export default {
  name: 'Schedule',
  data () {
    return {
      selTab: 'patrol',
      dataTable: {
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
      loadDlg: {
        visible: false,
        cfmLoading: false,
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
    onCfmUpldSubmited () {
      this.loadDlg.cfmLoading = true
      $('.hide-upload input[type=file]').click()
    },
    onSelFileChanged (e) {
      if (e.file.response) {
        const result = e.file.response.result
        this.dataTable.guard = result.guard
        this.dataTable.patrol = result.patrol || {
          columns: [],
          data: [],
          scroll: {x: 0, y: 0}
        }
      }
      this.loadDlg.visible = false
      this.loadDlg.cfmLoading = false
    },
    setTableRowCls (record, index) {
      return index % 2 ? '' : 'light-grey-bkgd'
    },
    async _reqBackend (symbol) {
      const url = `http://127.0.0.1:4000/schedule-patrols-sys/mdl/v1/${symbol}s`
      const resp = await this.$http.get(url, {
        params: {month: (new Date()).getMonth() + 1}
      })
      this.dataTable[symbol] = resp.data.data[0] || {
        columns: [],
        data: [],
        scroll: {x: 0, y: 0}
      }
    },
    async onGenePatrolClicked () {
      this.loadGenePatrol = true
      const resp = await this.$http.post(
        'http://127.0.0.1:4000/schedule-patrols-sys/api/v1/patrol/gene'
      )
      this.loadGenePatrol = false
      this.dataTable.patrol = resp.data.result || {
        columns: [],
        data: [],
        scroll: {x: 0, y: 0}
      }
      this.$success({
        title: '操作成功！',
        content: (
          <div>
            <p>已为当前月生成新的巡逻班表</p>
          </div>
        ),
        onOk() {
          this.onTopTabClicked('patrol')
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
      const btmBtn = await utils.$For('.btm-btn', ele => ele[0].innerText)
      tbodyHeight -= btmBtn.height() + 10
      const thead = await utils.$For('.ant-table-thead', ele => ele[0].innerText)
      tbodyHeight -= thead.height()
      const tbody = await utils.$For('.ant-table-body', ele => ele[0].innerText)
      tbody.css('max-height', `${tbodyHeight}px`)
      const tbodyInner = await utils.$For('.ant-table-body-inner', ele => ele[0].innerText)
      tbodyInner.css('max-height', `${tbodyHeight}px`)
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
