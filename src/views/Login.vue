<template>
  <div class="center-container">
    <a-form :form="form" style="width: 60vw" @submit="onLoginSubmitted">
      <a-form-item>
        <img src="@/assets/logo.svg" width="128" height="128"/>
      </a-form-item>
      <a-form-item class="mb-10">
        <a-input
          v-decorator="['name', { rules: [{ required: true, message: '必须输入姓名！' }] }]"
          placeholder="请输入姓名"
          size="large"
        />
      </a-form-item>
      <a-form-item>
        <a-input
          v-decorator="['code', { rules: [{ required: true, message: '必须输入警号！' }] }]"
          placeholder="请输入警号"
          size="large"
        />
      </a-form-item>
      <a-form-item>
        <a-button class="w-100" type="primary" html-type="submit" size="large">
          登录查看排班表
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data () {
    return {
      form: this.$form.createForm(this, { name: 'login' })
    }
  },
  methods: {
    onLoginSubmitted (e) {
      e.preventDefault()
      this.form.validateFields((err, values) => {
        if (err) {
          console.log(err)
          return
        }
        console.log('Received values of form: ', values)
        this.$router.push({path: "/schedule"})
      })
    }
  }
}
</script>

