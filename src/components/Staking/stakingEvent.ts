import { Web3 } from "web3";
import fs from "fs";

import constant from "../../constant";
import config from "../../config";
import { updateStakingLiquid } from "./stakingService";
import { ethers } from "ethers";
import {
  BonfireUserInfo,
  SproutHouseStaking,
  StakeInfo,
} from "./stakeInterface";
import { formatStaking, getAllAddress } from "../Tyrh/tyrhModel";
import { TyrhInterface } from "../Tyrh/tyrhInterface";

const web3 = new Web3(config.rpcProvider);
const stakingJsonFile = "./src/abis/staking.json";
const stakingAbi = JSON.parse(fs.readFileSync(stakingJsonFile, "utf-8"));
const tyrhStakingContract = new web3.eth.Contract(
  stakingAbi,
  config.tyrhStakingAddress
);
const bonfireJsonFile = "./src/abis/bonfire.json";
const bonfireAbi = JSON.parse(fs.readFileSync(bonfireJsonFile, "utf-8"));
const bonfireContract = new web3.eth.Contract(
  bonfireAbi,
  config.bonfireAddress
);
const sproutHouseJsonFile = "./src/abis/sproutHouse.json";
const sproutHouseAbi = JSON.parse(
  fs.readFileSync(sproutHouseJsonFile, "utf-8")
);
const sproutHouseContract = new web3.eth.Contract(
  sproutHouseAbi,
  config.sproutHouseAddress
);
const seedBankJsonFile = "./src/abis/seedBank.json";
const seedBankAbi = JSON.parse(fs.readFileSync(seedBankJsonFile, "utf-8"));
const seedBankContract = new web3.eth.Contract(
  seedBankAbi,
  config.seedbankAddress
);

const lourdesJsonFile = "./src/abis/lourdes.json";
const lourdesAbi = JSON.parse(fs.readFileSync(lourdesJsonFile, "utf-8"));
const lourdesContract = new web3.eth.Contract(
  lourdesAbi,
  config.lourdesAddress
);

const reservoirJsonFile = "./src/abis/reservoir.json";
const reservoirAbi = JSON.parse(fs.readFileSync(reservoirJsonFile, "utf-8"));
const reservoirContract = new web3.eth.Contract(
  reservoirAbi,
  config.reservoirAddress
);

const stakingEventStart = async () => {
  try {
    await formatStaking();
    const list: TyrhInterface[] = await getAllAddress();
    for (const item of list) {
      const tyrhStakeInfo: StakeInfo = await tyrhStakingContract.methods
        .userStakingInfo(item.address)
        .call();
      const tyrhStakeAmount = Number(
        ethers.formatEther(tyrhStakeInfo.totalAmount.toString())
      );

      const bonfireUserInfo: BonfireUserInfo = await bonfireContract.methods
        .userInfo(item.address)
        .call();
      const bonfireAmount = Number(
        ethers.formatEther(bonfireUserInfo.amount.toString())
      );

      let seedBankStakingInfo: any = await seedBankContract.methods
        .getUserStakingInfo(item.address)
        .call();
      let seedBankStakingAmount = seedBankStakingInfo[
        constant.SeedBankUserInfoObjectId.IsStaking
      ]
        ? Number(
            ethers.formatEther(
              seedBankStakingInfo[
                constant.SeedBankUserInfoObjectId.Amount
              ].toString()
            )
          )
        : 0;

      let lourdesStakingInfo: any = await lourdesContract.methods
        .getUserStakingList(item.address)
        .call();
      let lourdesStakingAmount = 0;
      for (const lourdesItem of lourdesStakingInfo) {
        if (lourdesItem["8"] === false && lourdesItem["9"] === false) {
          lourdesStakingAmount += Number(
            ethers.formatEther(lourdesItem["3"].toString())
          );
        }
      }

      let reservoirStakingInfo: any = await reservoirContract.methods
        .userInfo(item.address)
        .call();
      const reservoirStakingAmount = reservoirStakingInfo.isStaking
        ? Number(ethers.formatEther(reservoirStakingInfo.amount.toString()))
        : 0;

      const tyrhObject: TyrhInterface = {
        address: item.address,
        stakedTyrh: Number(tyrhStakeAmount.toFixed(6)),
        stakedBurn: Number(bonfireAmount.toFixed(6)),
        stakedPlant: Number(seedBankStakingAmount.toFixed(6)),
        stakedWater: Number(
          (lourdesStakingAmount + reservoirStakingAmount).toFixed(6)
        ),
      };
      await updateStakingLiquid(tyrhObject);
    }

    // sprout house staking
    const totCount: number = await sproutHouseContract.methods
      .totalStakingCount()
      .call();

    for (let i = 0; i < totCount; i++) {
      const info: SproutHouseStaking = await sproutHouseContract.methods
        .stakings(i.toString())
        .call();

      if (info.finished === false) {
        const amount = Number(ethers.formatEther(info.amount.toString()));
        const tyrhObject: TyrhInterface = {
          address: info.owner,
          stakedPlant: Number(amount.toFixed(6)),
        };
        await updateStakingLiquid(tyrhObject);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export default stakingEventStart;
