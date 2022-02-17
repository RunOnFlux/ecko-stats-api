import { Connection, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { DailyVolumeDto } from './dto/create-daily-volume.dto';
import {
  DailyVolume,
  DailyVolumeDocument,
  DailyVolumeSchema,
} from './schemas/daily-volume.schema';

@Injectable()
export class DailyVolumesService {
  constructor(
    @InjectModel(DailyVolume.name)
    private dailyVolumeModel: Model<DailyVolumeDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async findAll(): Promise<DailyVolume[]> {
    return this.dailyVolumeModel.find().exec();
  }

  async create(
    collectionName: string,
    createDailyVolume: DailyVolumeDto,
  ): Promise<any> {
    const document = await this.connection
      .model(collectionName, DailyVolumeSchema)
      .create(createDailyVolume);
    return document;
  }

  // async getDailyVolume() {}
}
