import { DefineComponent, Ref, VNode } from 'vue'

export type PageComponent =
  | ((c: any) => any)
  | VNode
  | DefineComponent<any>
  | Function
  | DefineComponent
  | Ref<((c: any) => any) | VNode | DefineComponent<any> | Function | DefineComponent>
  | any

export interface TabsPageProps {
  pages: Array<{ component: PageComponent; title: string; active?: boolean }>
}
