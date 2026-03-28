import { Plugin } from 'vue'
import DateFormat, { DateFormatComponent } from './dateFormat'
import ImageFormat, { ImageFormatComponent } from './imageFormat'
import DictFormat, { DictFormatComponent } from './dictFormat'
import JosnFormat, { JsonFormatComponent } from './josnFormat'
import DictEntrysFormat, { DictEntrysFormatComponent } from './dictEntrysFormat'
import TreeFormat, { TreeFormatComponent } from './treeFormat'
import TagColor, { TagColorComponent } from './tagColor'
import Tag, { TagComponent } from './tag'
import './style.scss'

export type FormatType =
  | DateFormatComponent
  | ImageFormatComponent
  | DictFormatComponent
  | JsonFormatComponent
  | DictEntrysFormatComponent
  | TreeFormatComponent
  | TagColorComponent
  | TagComponent

const plugin: Plugin = (app) => {
  app.component('date-format', DateFormat)
  app.component('image-format', ImageFormat)
  app.component('dict-format', DictFormat)
  app.component('json-format', JosnFormat)
  app.component('dict-entrys-format', DictEntrysFormat)
  app.component('tree-format', TreeFormat)
  app.component('tag-color', TagColor)
  app.component('tag', Tag)
}

export default plugin
