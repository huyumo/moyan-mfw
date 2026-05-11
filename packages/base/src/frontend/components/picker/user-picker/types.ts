import type { VNode } from 'vue'
import type { FormItemConfig } from '../../form/form-card/types'
import type { UserResponseDto, AdminCreateUserDto, UpdateUserDto } from '../../../apis/sys/schemas'

export type { UserResponseDto, AdminCreateUserDto, UpdateUserDto }

export type SearchBy = 'phone' | 'username' | 'both'

export interface UserPickerTheme {
  title?: string
  template: FormItemConfig[]
  helper?: string
  editable?: boolean
  searchBy?: SearchBy
  onSearch?: (keyword: string) => Promise<UserResponseDto | null>
  onCreate?: (data: AdminCreateUserDto) => Promise<UserResponseDto>
  onUpdate?: (id: string, data: UpdateUserDto) => Promise<UserResponseDto>
}

export interface UserPickerThemeFn {
  (context?: UserResponseDto): UserPickerTheme
}

export interface MfwUserPickerProps {
  modelValue?: string
  theme?: string
  helper?: string
  searchBy?: SearchBy
  onSearch?: (keyword: string) => Promise<UserResponseDto | null>
  onCreate?: (data: AdminCreateUserDto) => Promise<UserResponseDto>
  onUpdate?: (id: string, data: UpdateUserDto) => Promise<UserResponseDto>
}

export interface MfwUserPickerEmits {
  (e: 'update:modelValue', value: string | undefined): void
  (e: 'change', user: UserResponseDto | null): void
}

export interface MfwUserPickerInstance {
  clear: () => void
  getSelected: () => UserResponseDto | null
  setSelected: (user: UserResponseDto) => void
  refresh: () => Promise<void>
}

export interface MfwUserPickerSlots {
  default?: () => VNode[]
  empty?: () => VNode[]
  tag?: (props: { user: UserResponseDto }) => VNode[]
}
