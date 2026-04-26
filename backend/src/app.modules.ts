import { Module } from "@nestjs/common";
import { SupplierModule } from "./modules/supplier/supplier.module";

@Module({
  imports: [SupplierModule],
})
export class AppModule {}