export interface BaseComponent {
  name: string
  elProps?: {
    [key: string]: any
  }
  on?: {
    [key: string]: any
  }
}
