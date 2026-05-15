import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipPermission } from '../../../common/decorators/skip-permission.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { getPermissionValueCache } from '../../../common/constants/permissions';

@ApiTags('permission-values', '权限值标签映射')
@Controller('permission-values')
export class PermissionValuesController {
  @Get()
  @Public()
  @SkipPermission()
  @ApiOperation({ summary: '获取权限值标签映射表', description: '返回所有活跃的权限值标签及其位运算值' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getPermissionValues() {
    const cache = getPermissionValueCache();
    const result: Array<{ name: string; bitPosition: number; bitValue: string }> = [];
    let pos = 0;
    for (const [name, bitValue] of cache) {
      result.push({ name, bitPosition: pos++, bitValue: bitValue.toString() });
    }
    return result;
  }
}
