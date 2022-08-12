import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as pact from 'pact-lang-api';
import * as moment from 'moment';
import {
  AnalyticsDto,
  BurnDto,
  CirculatingSupplyDto,
  DaoTreasuryDto,
  LiquidityProvidingPositionDto,
} from './dto/analytics.dto';
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
                  (total-supply (- (kaddex.kdx.total-supply) (+ (at 'total-minted (kaddex.kdx.get-raw-supply 'network-rewards)) 
                    (- (at 'total-minted (kaddex.kdx.get-raw-supply 'network-rewards)) (kaddex.kdx.get-balance 'kaddex-kdx-wrapper-mint-bank)))))
                  (staking-data (map (kaddex.staking.get-stake-record) (keys kaddex.staking.stake-table)))
                  (staked-kdx (at 'staked-kdx (kaddex.staking.get-pool-state)))
                 ){'total-supply:total-supply, 'staking-data:staking-data, 'staked-kdx:staked-kdx})`,
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

      const vaultingPactResponse = await pact.fetch.local(
        {
          pactCode: `(let (
                      (now (at 'block-time (chain-data))))
                        (fold (+) 0.0
                          (map (at 'kdx-locked)
                            (filter (lambda (l) (> now (at 'lockup-end-time l)))
                              (kaddex.time-lock.read-all-lockups)))))`,
          meta: pact.lang.mkMeta(
            '',
            '0',
            0.0000001,
            150000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        `${this.BASE_URL}/chainweb/0.0/${this.NETWORK_ID}/chain/0/pact`,
      );

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
      const totalStaked = extractDecimal(data['staked-kdx']);
      const totalVaulted = extractDecimal(vaultingPactResponse?.result?.data);

      const filter = {
        chain: Number(this.CHAIN_ID),
        dayString: moment().format('YYYY-MM-DD'),
      };

      const circulatingSupplyToUpdate: CirculatingSupplyDto = {
        totalSupply: totalSupply,
        lockedAmount: totalLockedAmount,
        stakedAmount: totalStaked,
        vaultedAmount: totalVaulted,
      };

      const update = {
        circulatingSupply: circulatingSupplyToUpdate,
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );

      if (!founded) {
        const analyticsData: AnalyticsDto = {
          day: moment().hours(0).minutes(0).seconds(0).toDate(),
          dayString: moment().format('YYYY-MM-DD'),
          circulatingSupply: {
            totalSupply: totalSupply,
            lockedAmount: totalLockedAmount,
            stakedAmount: totalStaked,
            vaultedAmount: totalVaulted,
          },
          liquidityMining: 0,
          burn: { stakingBurn: 0, tokenBurn: 0 },
          chain: Number(this.CHAIN_ID),
          daoTreasury: { amount: 0, lpPositions: [] },
          communitySale: 0,
        };
        await this.analyticsModel.create(analyticsData);
      }
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
          pactCode: `
          (let* (
            (burned (fold (+) 0.0 (map (lambda (p) (at 'total-burned (kaddex.kdx.get-raw-supply p))) (kaddex.kdx.get-purpose-list))))
            (staking-burnt (at 'burnt-kdx (kaddex.staking.get-pool-state)))
           ){'burned:burned, 'staking-burnt:staking-burnt})
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

      const filter = {
        chain: Number(this.CHAIN_ID),
        dayString: moment().format('YYYY-MM-DD'),
      };

      const burnToUpdate: BurnDto = {
        tokenBurn: extractDecimal(data['burned']),
        stakingBurn: extractDecimal(data['staking-burnt']),
      };
      const update = {
        burn: burnToUpdate,
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded) {
        const analyticsData: AnalyticsDto = {
          day: moment().hours(0).minutes(0).seconds(0).toDate(),
          dayString: moment().format('YYYY-MM-DD'),
          circulatingSupply: {
            totalSupply: 0,
            lockedAmount: 0,
            stakedAmount: 0,
            vaultedAmount: 0,
          },
          liquidityMining: 0,
          burn: {
            tokenBurn: extractDecimal(data['burned']),
            stakingBurn: extractDecimal(data['staking-burnt']),
          },
          chain: Number(this.CHAIN_ID),
          daoTreasury: { amount: 0, lpPositions: [] },
          communitySale: 0,
        };
        await this.analyticsModel.create(analyticsData);
      }
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

      const filter = {
        chain: Number(this.CHAIN_ID),
        dayString: moment().format('YYYY-MM-DD'),
      };

      const update = {
        liquidityMining: totalLiquidityMining,
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded) {
        const analyticsData: AnalyticsDto = {
          day: moment().hours(0).minutes(0).seconds(0).toDate(),
          dayString: moment().format('YYYY-MM-DD'),
          circulatingSupply: {
            lockedAmount: 0,
            stakedAmount: 0,
            totalSupply: 0,
            vaultedAmount: 0,
          },
          liquidityMining: totalLiquidityMining,
          burn: { tokenBurn: 0, stakingBurn: 0 },
          chain: Number(this.CHAIN_ID),
          daoTreasury: { amount: 0, lpPositions: [] },
          communitySale: 0,
        };
        await this.analyticsModel.create(analyticsData);
      }
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
            (lp-position (kaddex.wrapper.get-user-position-stats coin kaddex.kdx ${JSON.stringify(
              this.DAO_ACCOUNT,
            )}))
          ){'max-cap:max-cap, 'dao-treasury:dao-treasury, 'account-balance:account-balance, 'lp-position:lp-position})
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

      const daoAmount =
        extractDecimal(data['max-cap']) -
        extractDecimal(data['dao-treasury']['total-burned']) +
        (extractDecimal(data['account-balance']) -
          extractDecimal(data['dao-treasury']['total-minted']));

      const lpPositions: LiquidityProvidingPositionDto[] = [
        {
          tokenAIdentifier: 'coin',
          tokenBIdentifier: 'kaddex.kdx',
          amountTokenA: extractDecimal(data['lp-position']['totalA']),
          amountTokenB: extractDecimal(data['lp-position']['totalB']),
          poolShare: extractDecimal(data['lp-position']['user-pool-share']),
        },
      ];

      const daoTreasuryToUpdate: DaoTreasuryDto = {
        amount: daoAmount,
        lpPositions: lpPositions,
      };

      const filter = {
        chain: Number(this.CHAIN_ID),
        dayString: moment().format('YYYY-MM-DD'),
      };

      const update = {
        daoTreasury: daoTreasuryToUpdate,
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded) {
        const analyticsData: AnalyticsDto = {
          day: moment().hours(0).minutes(0).seconds(0).toDate(),
          dayString: moment().format('YYYY-MM-DD'),
          circulatingSupply: {
            totalSupply: 0,
            lockedAmount: 0,
            stakedAmount: 0,
            vaultedAmount: 0,
          },
          liquidityMining: 0,
          burn: { tokenBurn: 0, stakingBurn: 0 },
          chain: Number(this.CHAIN_ID),
          daoTreasury: { amount: daoAmount, lpPositions: lpPositions },
          communitySale: 0,
        };
        await this.analyticsModel.create(analyticsData);
      }
      this.logger.log('ANALYTICS IMPORT DAO TREASURY END');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async importCommunitySale() {
    this.logger.log('ANALYTICS IMPORT COMMUNITY SALE START');
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `
          (let (
            (now (add-time (at 'block-time (chain-data)) (days -181))))
              (fold (+) 0.0
                (map (at 'amountKdx)
                  (filter (lambda (l) (> now (at 'timestamp l)))
                    (kaddex.public-sale.read-all-reservations)))))`,
          meta: pact.lang.mkMeta(
            '',
            '0',
            0.0000001,
            160000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        `${this.BASE_URL}/chainweb/0.0/${this.NETWORK_ID}/chain/0/pact`,
      );
      const {
        result: { data },
      }: { result: { data: any } } = pactResponse;

      const totalCommunitySale = extractDecimal(data);

      const filter = {
        chain: Number(this.CHAIN_ID),
        dayString: moment().format('YYYY-MM-DD'),
      };

      const update = {
        communitySale: totalCommunitySale,
      };

      const founded = await this.analyticsModel.findOneAndUpdate(
        filter,
        update,
      );
      if (!founded) {
        const analyticsData: AnalyticsDto = {
          day: moment().hours(0).minutes(0).seconds(0).toDate(),
          dayString: moment().format('YYYY-MM-DD'),
          circulatingSupply: {
            lockedAmount: 0,
            stakedAmount: 0,
            totalSupply: 0,
            vaultedAmount: 0,
          },
          liquidityMining: 0,
          burn: { tokenBurn: 0, stakingBurn: 0 },
          chain: Number(this.CHAIN_ID),
          daoTreasury: { amount: 0, lpPositions: [] },
          communitySale: totalCommunitySale,
        };
        await this.analyticsModel.create(analyticsData);
      }
      this.logger.log('ANALYTICS IMPORT COMMUNITY SALE END');
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getData(dateStart: Date, dateEnd: Date): Promise<any> {
    return await this.analyticsModel
      .find({
        dayString: {
          $gte: dateStart,
          $lte: dateEnd,
        },
      })
      .sort([['dayString', 'asc']])
      .exec();
  }
}
