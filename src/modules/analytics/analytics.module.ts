import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsImporter } from './analytics.importer';
import { AnalyticsService } from './analytics.service';
import { Analytics, AnalyticsSchema } from './schemas/analytics.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analytics.name, schema: AnalyticsSchema },
    ]),
    HttpModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsImporter],
})
export class AnalyticsModule {}
