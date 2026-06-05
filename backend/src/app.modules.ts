import { Module } from "@nestjs/common";
import { SupplierModule } from "./modules/supplier/supplier.module";
import AdModule from "moyan-mfw-extension-ad/backend";
import { ConfigModule } from "moyan-mfw-extension-config/backend";

@Module({
  imports: [SupplierModule, AdModule, ConfigModule],
})
export class AppModule {}