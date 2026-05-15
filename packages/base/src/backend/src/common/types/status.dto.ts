import { IsIn, IsNotEmpty, IsNumber } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";

export const STATUS = {
    ENABLED: 0,
    DISABLED: 1,
}

export class StatusDto {
    @ApiProperty({ description: '状态,1:启用,0:禁用', enum: STATUS, example: STATUS.ENABLED })
    @IsNumber()
    @IsIn([0, 1])
    @IsNotEmpty({ message: '状态不能为空' })
    status: number;
}