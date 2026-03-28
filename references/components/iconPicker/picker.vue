<template>
  <div class="icon-picker-box">
    <el-input v-model="keyword" @input="input" placeholder="图标名称">
      <template #prepend>
        <el-button :icon="Search" />
      </template>
    </el-input>
    <el-scrollbar class="icon-picker-box" height="400px">
      <el-divider content-position="left"> 常用 </el-divider>
      <div class="icon-picker-list">
        <div class="icon-picker-item" :key="index" v-for="(item, index) in stock" @click="select(item)">
          <i :class="`${font_family} ${css_prefix_text}${item.font_class}`" />
        </div>
      </div>
      <el-divider content-position="left"> 全部 </el-divider>
      <div class="icon-picker-list">
        <div class="icon-picker-item" :key="index" v-for="(item, index) in glyphs" @click="select(item)">
          <i :class="`${font_family} ${css_prefix_text}${item.font_class}`" />
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import iconData from '@/assets/style/icon/iconfont.json'
import { Search } from '@element-plus/icons-vue'
import { DB } from '@/lib/uilt.db'
import { storeUser } from '@/common/use/store/user';
export default defineComponent({
  emits: ['confirm'],
  setup(props, { emit }) {
    const stock = ref<typeof iconData.glyphs>(storeUser.db.get('user-icon-stock', []))

    const glyphs = ref(iconData.glyphs)
    const font_family = iconData.font_family
    const css_prefix_text = iconData.css_prefix_text
    const keyword = ref('')

    const input = (value: string) => {
      glyphs.value = iconData.glyphs.filter((item) => {
        return item.name.includes(value)
      })
    }

    const select = (item: any) => {
      if (!stock.value.some((item1) => item1.icon_id === item.icon_id)) {
        stock.value.push(item)
        storeUser.db.set('user-icon-stock', stock.value)
      }

      emit('confirm', `${font_family} ${css_prefix_text}${item.font_class}`)
    }
    return { glyphs, font_family, css_prefix_text, select, input, keyword, Search, stock }
  }
})
</script>

<style lang="scss" scoped>
.icon-picker-box {
  width: 100%;

  .icon-picker-list {
    width: 100%;
    word-wrap: break-word;
    display: flex;
    flex-wrap: wrap;

    .icon-picker-item {
      width: 40px;
      height: 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border-radius: 4px;

      i {
        font-size: 18px;
      }

      &:hover {
        background: #fff;
        cursor: pointer;

        i {
          font-size: 30px;
        }
      }

      .title {
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        position: relative;
        text-align: center;
      }
    }
  }
}
</style>
