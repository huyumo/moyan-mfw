import { Component, ExtractPropTypes } from 'vue'
import { InputProps } from 'element-plus/es/components/input'
import { inputNumberProps } from 'element-plus/es/components/input-number'
import { AutocompleteProps } from 'element-plus/es/components/autocomplete'
import {
  CascaderProps,
  ComponentSize,
  RateProps,
  SliderProps,
  SwitchProps,
  timePickerDefaultProps,
  TransferProps,
  UploadProps,
  DatePickerProps
} from 'element-plus'
import { SelectV2Context } from 'element-plus/es/components/select-v2'
import { DateCell, IDatePickerType } from 'element-plus/es/components/date-picker/src/date-picker.type'
import { UploadFileProps, UploadImgProps, UploadImgsProps, UploadVideoProps } from './upload'
import { PointSelectProps } from './alimap'
import { MoRadioProps } from './formCard/moRadio'
import { InputNumberProps } from 'element-plus/lib/components'
import { MoDivProps } from './moDiv/types'
import { UserPickerProps } from './userPicker/userPickerManager'
import { JSONEditorOptions } from "jsoneditor";
import { ElRadioGroupV2 } from './elelements/el-radio-group-v2/type'


export interface PublicElProps {
  [key: string]: any
  clearable?: boolean
  placeholder?: string
}

export interface formCrudComponents {
  'el-input': {
    elProps: InputProps & PublicElProps
  }
  'el-input-number': {
    elProps: PublicElProps & InputNumberProps
  }

  'el-autocomplete': {
    elProps: AutocompleteProps & PublicElProps
  }

  'el-cascader': {
    elProps: CascaderProps & PublicElProps
  }

  'el-select-v2': {
    elProps: SelectV2Context['props'] & PublicElProps
  }

  'el-tree-select': {
    elProps: SelectV2Context['props'] & PublicElProps
  }

  'el-color-picker': {
    elProps: {
      disabled?: boolean
      size?: number
      'show-alpha'?: boolean
      'color-format'?: 'hsl' | 'hsv' | 'hex' | 'rgb'
      'popper-class'?: string
      predefine: any[]
    } & PublicElProps
  }

  'el-date-picker': {
    elProps: DateCell & {
      type?: IDatePickerType
      disabled?: boolean
      name?: string | unknown[]
      modelValue?: string | number | Date | (string | number | Date)[]
      editable?: boolean
      popperClass?: string
      popperOptions?: Partial<DatePickerProps>
      placeholder?: string
      readonly?: boolean
      clearable?: boolean
      prefixIcon?:
        | string
        | import('vue').Component<any, any, any, import('vue').ComputedOptions, import('vue').MethodOptions>
      validateEvent?: boolean
      clearIcon?:
        | string
        | import('vue').Component<any, any, any, import('vue').ComputedOptions, import('vue').MethodOptions>
      rangeSeparator?: string
      isRange?: boolean
      shortcuts?: unknown[]
      arrowControl?: boolean
      unlinkPanels?: boolean
    } & PublicElProps
  }

  'el-rate': {
    elProps: RateProps & PublicElProps
  }

  'el-slider': {
    elProps: ExtractPropTypes<SliderProps> & PublicElProps
  }

  'el-switch': {
    elProps: SwitchProps & PublicElProps
  }

  'el-time-picker': {
    elProps: ExtractPropTypes<typeof timePickerDefaultProps> & PublicElProps
  }

  'el-time-select': {
    elProps: {
      size?: ComponentSize
      disabled?: boolean
      name?: string
      editable?: boolean
      effect?: string
      placeholder: string
      clearable?: boolean
      prefixIcon?: string | Component<any, any, any, import('vue').ComputedOptions, import('vue').MethodOptions>
      end?: string
      start?: string
      format?: string
      clearIcon?: string | Component<any, any, any, import('vue').ComputedOptions, import('vue').MethodOptions>
      step?: string
      minTime?: string
      maxTime?: string
    } & PublicElProps
  }

  'el-transfer': {
    elProps: TransferProps & PublicElProps
  }

  'upload-img': {
    elProps: UploadImgProps & PublicElProps
  }

  'upload-imgs': {
    elProps: UploadImgsProps & PublicElProps
  }

  'alimap-point-select': {
    elProps: PointSelectProps & PublicElProps
  }

  'upload-file': {
    elProps: UploadFileProps & PublicElProps
  }

  'upload-video': {
    elProps: UploadVideoProps & PublicElProps
  }

  'upload-file-drag': {
    elProps: UploadFileProps & PublicElProps
  }

  'quill-editor': {
    elProps: {
      uploadType: { [K in keyof UploadProps]?: UploadProps[K] }
    } & PublicElProps
  }

  'mo-radio': {
    elProps: MoRadioProps & PublicElProps
  }

  'el-radio-group-v2': {
    elProps: ElRadioGroupV2 & PublicElProps
  }

  'icon-picker': {
    elProps: IconPickerProps & PublicElProps
  }

  'mo-div': {
    elProps: MoDivProps
  }

  'user-picker': {
    elProps: UserPickerProps
  }

  default: {
    elProps: {} & PublicElProps
  }

  /**
modelValue	Object	要编辑的json值	--
options	Object	jsoneditor 的options，参考configuration-options	--
currentMode	String	当前编辑模式	code
modeList	Array	可选的编辑模式列表	["tree", "code", "form", "text", "view"]
language	Array	语言	en
   */
  'json-editor': {
    elProps: {
      options?:JSONEditorOptions   // options，参考configuration-options	--
      currentMode?: string
      modeList?: Array<'tree' | 'code' | 'form' | 'text' | 'view'>
      language?: Array<string>
    } & PublicElProps
  }
}

export type formCrudComponentTypes = keyof formCrudComponents
