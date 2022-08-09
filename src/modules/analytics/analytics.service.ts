import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as pact from 'pact-lang-api';
import * as moment from 'moment';
import { AnalyticsDto } from './dto/analytics.dto';
import { Analytics, AnalyticsDocument } from './schemas/analytics.schema';
import { extractDecimal, extractTime } from 'src/utils/pact-data.utils';

@Injectable()
export class AnalyticsService {
  private readonly logger = new ConsoleLogger(AnalyticsService.name);

  private readonly DAO_ACCOUNT =
    'w:P51MUVF_xON5hmPdx49B4IQp4zhlGI2e_jS8A3ruQOY:keys-2';
  private readonly NETWORK_ID = process.env.CHAINWEB_NETWORK_ID;
  private readonly BASE_URL = process.env.CHAINWEB_NODE_URL;
  private readonly CHAIN_ID = process.env.CHAIN_ID;
  private readonly URL = `${this.BASE_URL}/chainweb/0.0/${this.NETWORK_ID}/chain/${this.CHAIN_ID}/pact`;

  constructor(
    @InjectModel(Analytics.name)
    private analyticsModel: Model<AnalyticsDocument>,
  ) {}

  async importCirculatingSupply() {
    this.logger.log('ANALYTICS IMPORT CIRCULATING SUPPLY START');
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `(let* (
              (total-supply (kaddex.kdx.total-supply))
              (staking-data (map (kaddex.staking.get-stake-record) (keys kaddex.staking.stake-table)))
             ){'total-supply:total-supply, 'staking-data:staking-data})`,
          meta: pact.lang.mkMeta(
            '',
            this.CHAIN_ID.toString(),
            0.0000001,
            150000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        this.URL,
      );
      const {
        result: { data },
      }: { result: { data: any } } = pactResponse;

      let totalLockedAmount = 0;

      data['staking-data'].map((item) => {
        const validLockedItems = item.locks.filter((x) =>
          moment().isBefore(extractTime(x.until)),
        );

        for (const lockedItem of validLockedItems) {
          totalLockedAmount += extractDecimal(lockedItem.amount);
        }
      });

      const totalSupply = extractDecimal(data['total-supply']);
      const circulatingSupply = totalSupply - totalLockedAmount;

      const filter = { chain: Number(this.CHAIN_ID) };
      const update = {
        $set: { circulatingSupply: circulatingSupply, lastUpdate: new Date() },
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded._id) {
        const analyticsData: AnalyticsDto = {
          circulatingSupply: circulatingSupply,
          liquidityMining: 0,
          burned: 0,
          chain: Number(this.CHAIN_ID),
          daoTreasury: 0,
          lastUpdate: new Date(),
        };
        await this.analyticsModel.create(analyticsData);
      }
      this.logger.log(
        `Circulating supply data -> total-supply: ${totalSupply} | total-amount-locked: ${totalLockedAmount} | circulating-supply: ${circulatingSupply}`,
      );
      this.logger.log('ANALYTICS IMPORT CIRCULATING SUPPLY  END');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async importBurned() {
    this.logger.log('ANALYTICS IMPORT BURNED START');
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `(fold (+) 0.0 (map (lambda (p) (at 'total-burned (kaddex.kdx.get-raw-supply p))) (kaddex.kdx.get-purpose-list)))`,
          meta: pact.lang.mkMeta(
            '',
            this.CHAIN_ID.toString(),
            0.0000001,
            150000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        this.URL,
      );
      const {
        result: { data },
      }: { result: { data: any } } = pactResponse;

      const totalBurned = extractDecimal(data);

      const filter = { chain: Number(this.CHAIN_ID) };
      const update = {
        $set: { burned: totalBurned, lastUpdate: new Date() },
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded._id) {
        const analyticsData: AnalyticsDto = {
          circulatingSupply: 0,
          liquidityMining: 0,
          burned: totalBurned,
          chain: Number(this.CHAIN_ID),
          daoTreasury: 0,
          lastUpdate: new Date(),
        };
        await this.analyticsModel.create(analyticsData);
      }
      this.logger.log(`Burned data -> total-burned: ${totalBurned}`);
      this.logger.log('ANALYTICS IMPORT BURNED END');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async importLiquidityMining() {
    this.logger.log('ANALYTICS IMPORT LIQUIDITY MINING START');
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `(+ (- (kaddex.kdx.get-purpose-max-cap 'network-rewards) (at 'total-minted (kaddex.kdx.get-raw-supply 'network-rewards))) (kaddex.kdx.get-balance 'kaddex-kdx-wrapper-mint-bank))`,
          meta: pact.lang.mkMeta(
            '',
            this.CHAIN_ID.toString(),
            0.0000001,
            150000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        this.URL,
      );
      const {
        result: { data },
      }: { result: { data: any } } = pactResponse;

      const totalLiquidityMining = extractDecimal(data);

      const filter = { chain: Number(this.CHAIN_ID) };
      const update = {
        $set: { liquidityMining: totalLiquidityMining, lastUpdate: new Date() },
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded._id) {
        const analyticsData: AnalyticsDto = {
          circulatingSupply: 0,
          liquidityMining: totalLiquidityMining,
          burned: 0,
          chain: Number(this.CHAIN_ID),
          daoTreasury: 0,
          lastUpdate: new Date(),
        };
        await this.analyticsModel.create(analyticsData);
      }
      this.logger.log(
        `Liquidity Mining data -> total-liquidity-mining: ${totalLiquidityMining}`,
      );
      this.logger.log('ANALYTICS IMPORT LIQUIDITY MINING END');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async importDaoTreasury() {
    this.logger.log('ANALYTICS IMPORT DAO TREASURY START');
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `
          (let* (
            (max-cap (kaddex.kdx.get-purpose-max-cap 'dao-treasury))
            (dao-treasury (kaddex.kdx.get-raw-supply 'dao-treasury))
            (account-balance (kaddex.kdx.get-balance ${JSON.stringify(
              this.DAO_ACCOUNT,
            )}))
          ){'max-cap:max-cap, 'dao-treasury:dao-treasury, 'account-balance:account-balance})
          `,
          meta: pact.lang.mkMeta(
            '',
            this.CHAIN_ID.toString(),
            0.0000001,
            150000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        this.URL,
      );
      const {
        result: { data },
      }: { result: { data: any } } = pactResponse;

      const daoTreasury =
        extractDecimal(data['max-cap']) -
        extractDecimal(data['dao-treasury']['total-burned']) +
        (extractDecimal(data['account-balance']) -
          extractDecimal(data['dao-treasury']['total-minted']));

      const filter = { chain: Number(this.CHAIN_ID) };
      const update = {
        $set: { daoTreasury: daoTreasury, lastUpdate: new Date() },
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded._id) {
        const analyticsData: AnalyticsDto = {
          circulatingSupply: 0,
          liquidityMining: 0,
          burned: 0,
          chain: Number(this.CHAIN_ID),
          daoTreasury: daoTreasury,
          lastUpdate: new Date(),
        };
        await this.analyticsModel.create(analyticsData);
      }
      this.logger.log(`DAO Treasury data -> daoTreasury: ${daoTreasury}`);
      this.logger.log('ANALYTICS IMPORT DAO TREASURY END');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getData(): Promise<any> {
    return await this.analyticsModel.findOne().exec();
  }
}
