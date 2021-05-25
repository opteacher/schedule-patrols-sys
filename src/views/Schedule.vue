<template>
  <div>
    <div class="mtb-10">
      <a-button-group class="mr-8">
        <a-button @click="onLoadClicked">导入排班</a-button>
      </a-button-group>
      <a-upload
        class="hide-upload"
        style="display: none"
        name="file"
        action="http://127.0.0.1:4000/schedule-patrols-sys/api/v1/file/upload"
        :multiple="true"
        accept=".xlsx,.xls"
        @change="onSelFileChanged"
      />
      <a-button-group>
        <a-button
          :type="selTab === 'duty' ? 'primary' : 'default'"
          @click="selTab = 'duty'"
        >排班表</a-button>
        <a-button
          :type="selTab === 'service' ? 'primary' : 'default'"
          @click="selTab = 'service'"
        >勤务表</a-button>
        <a-button
          :type="selTab === 'my' ? 'primary' : 'default'"
          @click="selTab = 'my'"
        >我的</a-button>
      </a-button-group>
    </div>
    <a-table :columns="colMap[selTab]" :data-source="data">
      <span slot="date" slot-scope="text, record">
        {{record.date}}<br/>{{record.week}}
      </span>
    </a-table>
  </div>
</template>

<script>
import $ from 'jquery'
export default {
  name: 'Schedule',
  data () {
    return {
      selTab: 'service',
      colMap: {
        duty: [{
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          scopedSlots: { customRender: 'date' }
        }, {
          title: '值班组',
          dataIndex: 'duty',
          key: 'duty'
        }, {
          title: '中班组',
          dataIndex: 'middle',
          key: 'middle'
        }],
        service: [{
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          scopedSlots: { customRender: 'date' }
        }, {
          title: '东片',
          dataIndex: 'east',
          key: 'east'
        }, {
          title: '西片',
          dataIndex: 'west',
          key: 'west'
        }, {
          title: '平峰',
          dataIndex: 'traffic',
          key: 'traffic'
        }],
        my: [{
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          scopedSlots: { customRender: 'date' }
        }]
      },
      data: []
    }
  },
  created () {

  },
  methods: {
    onLoadClicked () {
      this.$confirm({
        title: '排班表内容格式，示例如下（可不带表头）',
        content: () => <table class='example-table'>
          <thead>
            <tr><td>日期</td><td>值班组</td><td>中班组</td></tr>
          </thead>
          <tbody>
            <tr><td>5/1</td><td>黄高巍</td><td>乔贝</td></tr>
            <tr><td>5/2</td><td>田书钢</td><td>姚勇宾</td></tr>
            <tr><td colspan='3'>………………</td></tr>
          </tbody>
        </table>,
        onOk() {
          $('.hide-upload input[type=file]').click()
        }
      })
    },
    onSelFileChanged (e) {
      console.log(e)
    }
  }
}
</script>

<style>
.example-table {
  width: 100%;
}

.example-table tr {
  border: 1px solid #ddd;
}

.example-table tr td {
  border: 1px solid #ddd;
  text-align: center;
}
</style>

