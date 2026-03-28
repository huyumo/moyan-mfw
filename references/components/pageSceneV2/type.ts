import { DefineComponent, HTMLAttributes, VNode } from 'vue'
import { SearchFormTemplate, SearchFormTemplateArray, SearchFormTemplateItem } from '../formCard/type'

export interface SearchOptions {
  template: SearchFormTemplate
  sort?: Array<SearchFormTemplateItem>
}

export interface PageSceneV2 {
  subPagePanel: {
    open(options: {
      title?: string
      component: VNode | DefineComponent<any> | Function | any
      props?: { [key: string]: any }
      on?: { [key: string]: Function }
    }): void
    close(): void
  }
  doRefresh(): void
  exec(): void
  doSearch(): void
}
