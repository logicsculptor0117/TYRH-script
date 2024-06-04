import { EventLog, Web3 } from "web3";
import colors from "colors";
import fs from "fs";

import constant from "../../constant";
import {
  getBlockInfoByName,
  updateBlockInfoByName,
} from "../BlockInfo/blockService";
import config from "../../config";
import { updateTyrhLiquid } from "./tyrhService";
import { BlockInfo } from "../BlockInfo/blockInterface";
const tyrhJsonFile = "./src/abis/tyrh.json";
const tyrhAbi = JSON.parse(fs.readFileSync(tyrhJsonFile, "utf-8"));

const web3 = new Web3(config.rpcProvider);
const tyrhContract = new web3.eth.Contract(tyrhAbi, config.tyrhAddress);

const getPastEvents = async (from: number, to: number) => {
  try {
    const toBlock = Math.min(from + 9000, to);
    const pastEvents = (await tyrhContract.getPastEvents("Transfer", {
      fromBlock: from,
      toBlock,
    })) as EventLog[];

    await updateTyrhLiquid(pastEvents);

    await updateBlockInfoByName({
      name: constant.BlockName.TyrhBlock,
      block: toBlock,
    });

    console.log(`update completed from ${from} to ${toBlock}`);

    if (toBlock < to) {
      await getPastEvents(from + 9001, to);
    }
  } catch (err) {
    console.log({ err });
  }
};

const tyrhEventStart = async () => {
  try {
    const block: BlockInfo = await getBlockInfoByName({
      name: constant.BlockName.TyrhBlock,
    });
    const from = block.block;
    const blockNumber = Number(await web3.eth.getBlockNumber());
    const to = blockNumber;

    if (from === to) {
      console.log(colors.yellow(`No new block in transfer event`));
      return;
    }

    console.log(`tyrh event: getting event between: ${from + 1} and ${to}`);
    await getPastEvents(from + 1, to);
  } catch (err) {
    console.log({ err });
  }
};

export default tyrhEventStart;
