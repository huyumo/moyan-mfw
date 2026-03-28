<template>
  <div class="imageList">
    <div
      class="imageItem"
      :style="'background-image: url(' + item + ')'"
      v-for="(item, index) in images"
      :key="index"
      @click="viewImage(item)"
    ></div>

    <el-dialog append-to-body v-model="dialogImageVisible" title="查看图片" width="80%">
      <div class="viewImage"><img :src="dialogImage" /></div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  props: { images: { type: Array, default: () => {} } },
  data() {
    return {
      dialogImageVisible: false,
      dialogImage: ''
    }
  },
  methods: {
    viewImage(image) {
      this.dialogImage = image
      this.dialogImageVisible = true
    }
  }
}
</script>
