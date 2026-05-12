import { Module } from "@nestjs/common";
import { SupplierModule } from "./modules/supplier/supplier.module";
import AdModule from "moyan-mfw-extension-ad/backend";

@Module({
  imports: [SupplierModule, AdModule],
})
export class AppModule {}