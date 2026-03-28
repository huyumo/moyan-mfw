import { Plugin } from 'vue'
import PageScene from './pageScene/index.vue'
import PageSceneV2 from './pageSceneV2/index.vue'
import FormCard from './formCard/index.vue'
import FormCard1 from './formCard/index1.vue'
import FormBar from './formCard/formBar.vue'
import TableList from './tableList/index.vue'
import QuillEditor from './quill/index.vue'
import Upload from './upload'
import Formatters from './formatters'
import AuthButton from './permission/authButton'
import MoRadio from './formCard/moRadio'
import ImportXlsxPanel from './importXlsxPanel/index.vue'
import AliMap from './alimap'
import IconPicker from './iconPicker/index.vue'
import TabsPage from './tabsPage/index.vue'
import MoDiv from './moDiv/index.vue'
import UserPicker from "./userPicker/index.vue";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import JsonEditor from "./jsonEditor/index.vue";
import ElRadioGroupV2 from "./elelements/el-radio-group-v2/index.vue";

const plugin: Plugin = (app:any) => {
  app.use(Formatters)
  app.use(Upload)
  app.use(AliMap)
  app.component('page-scene', PageScene)
  app.component('page-scene-v2', PageSceneV2)
  app.component('form-card', FormCard)
  app.component('form-card-1', FormCard1)
  app.component('form-bar', FormBar)
  app.component('table-list', TableList)
  app.component('quill-editor', QuillEditor)
  app.component('auth-button', AuthButton)
  app.component('mo-radio', MoRadio)
  app.component('el-radio-group-v2', ElRadioGroupV2)
  app.component('import-xlsx-panel', ImportXlsxPanel)
  app.component('icon-picker', IconPicker)
  app.component('tabs-page', TabsPage)
  app.component('mo-div', MoDiv)
  app.component('user-picker', UserPicker)
  app.component('vue-json-pretty', VueJsonPretty)
  app.component('json-editor', JsonEditor)
}

export default plugin
