import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { throwExpression } from 'src/utils/common.util';
import {
  MempoolLookupCommand,
  MempoolLookupContent,
  PactCommand,
} from './interfaces/mempool.interfaces';
import { GasData, GasDataDocument } from './schemas/gas-data.schema';

@Injectable()
export class MempoolService {
  private readonly logger = new ConsoleLogger(MempoolService.name);

  private readonly CHAINDATA_NODE_URL = process.env.CHAINDATA_NODE_URL;
  private readonly CHAINWEB_NETWORK_ID = process.env.CHAINWEB_NETWORK_ID;
  private readonly CHAIN_ID = process.env.CHAIN_ID;
  private readonly MAX_BLOCK_GAS_LIMIT = 150000;
  private readonly SUGGESTED_DELTA_PERCENTAGE = 0.2;
  private readonly LOWER_DELTA_PERCENTAGE = 0.1;
  private readonly HIGHEST_DELTA_PERCENTAGE = 0.3;
  constructor(
    @InjectModel(GasData.name)
    private gasDataModel: Model<GasDataDocument>,
    private readonly httpService: HttpService,
  ) {}

  async importGasData() {
    try {
      let gasData: GasData = {
        networkCongested: false,
        highestGasPrice: 0,
        lowestGasPrice: 0,
        suggestedGasPrice: 0,
        timestamp: new Date(),
      };

      const pendingKeys = await this.mempoolGetPendingRequests();

      if (pendingKeys.length > 0) {
        const pendingCommands = await this.mempoolLookupRequests(pendingKeys);

        let usedGas: number = 0;
        let gasPrices: number[] = [];

        const orderedTransactions = pendingCommands.sort(
          (a, b) => b.command.meta.gasPrice - a.command.meta.gasPrice,
        );

        orderedTransactions.forEach((element) => {
          if (element) {
            usedGas += element.command.meta.gasLimit;
            gasPrices.push(element.command.meta.gasPrice);
          }

          if (usedGas > this.MAX_BLOCK_GAS_LIMIT) {
            gasData.networkCongested = true;
            return false;
          }
        });

        if (gasPrices.length > 0) {
          let medianValue = 0.0;

          if (gasPrices.length % 2 === 0) {
            var firstValue = gasPrices[gasPrices.length / 2 - 1];
            var secondValue = gasPrices[gasPrices.length / 2];
            medianValue = (firstValue + secondValue) / 2;
          } else {
            medianValue = gasPrices[Math.trunc(gasPrices.length / 2)];
          }

          gasData.suggestedGasPrice =
            medianValue + medianValue * this.SUGGESTED_DELTA_PERCENTAGE;
          gasData.highestGasPrice =
            gasPrices[0] + gasPrices[0] * this.HIGHEST_DELTA_PERCENTAGE;
          gasData.lowestGasPrice =
            gasPrices[gasPrices.length - 1] +
            gasPrices[gasPrices.length - 1] * this.LOWER_DELTA_PERCENTAGE;
        }
      }

      const founded = await this.gasDataModel.findOneAndUpdate({}, gasData);

      if (!founded) {
        await this.gasDataModel.create(gasData);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async mempoolGetPendingRequests(): Promise<string[]> {
    const getPendingRequest = await this.httpService.post(
      `${this.CHAINDATA_NODE_URL}/chainweb/0.0/${this.CHAINWEB_NETWORK_ID}/chain/${this.CHAIN_ID}/mempool/getPending`,
    );
    const result = await lastValueFrom(getPendingRequest);

    if (result.status === 200) {
      return result.data.hashes;
    }
  }

  private async mempoolLookupRequests(
    pendingKeys: string[],
  ): Promise<MempoolLookupCommand[]> {
    const lookupRequest = await this.httpService.post(
      `${this.CHAINDATA_NODE_URL}/chainweb/0.0/${this.CHAINWEB_NETWORK_ID}/chain/${this.CHAIN_ID}/mempool/lookup`,
      pendingKeys,
    );
    const result = await lastValueFrom(lookupRequest);

    const ret: MempoolLookupCommand[] = [];

    if (result.status === 200) {
      for (let i = 0; i < result.data.length; i++) {
        const requestKey = pendingKeys[i];
        const txRes = result.data[i];
        const tag =
          txRes?.tag ?? throwExpression('Unexpected non-string in tag field');

        if (tag === 'Pending') {
          const contents =
            txRes?.contents ??
            throwExpression('Unexpected non-string in contents field');

          var lookupContent: MempoolLookupContent = JSON.parse(contents);
          const command: PactCommand = JSON.parse(lookupContent.cmd);

          ret.push({ requestKey, command });
        }
      }
    }

    return ret;
  }

  async getGasData() {
    return await this.gasDataModel.findOne({}, { _id: 0 });
  }
}
