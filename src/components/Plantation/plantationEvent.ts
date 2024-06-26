import { Web3 } from "web3";
import fs from "fs";

import constant from "../../constant";
import config from "../../config";
import { formatPlantation, getAllAddress } from "../Tyrh/tyrhModel";
import { TyrhInterface } from "../Tyrh/tyrhInterface";
import { updatePlantation } from "./plantationService";

const web3 = new Web3(config.rpcProvider);
const plantationJsonFile = "./src/abis/plantation.json";
const plantationAbi = JSON.parse(fs.readFileSync(plantationJsonFile, "utf-8"));
const plantationContract = new web3.eth.Contract(
  plantationAbi,
  config.plantationAddress
);

const plantationEventStart = async () => {
  try {
    await formatPlantation();
    const list: TyrhInterface[] = await getAllAddress();
    for (const item of list) {
      const infos: any = await plantationContract.methods
        .getUserTreesWithoutNFTs(item.address)
        .call();

      let nft = [0, 0, 0, 0, 0, 0];
      for (const info of infos) {
        if (info[constant.PlantationTreeObjectId.GrownUp] === true) {
          nft[info[constant.PlantationTreeObjectId.TypeId]]++;
        }
      }
      console.log(`plantation: ${nft}, ${item.address}`);

      await updatePlantation(nft, item.address);
    }
  } catch (err) {
    console.log(`plantationEventStart ~ ${err}`);
  }
};

export default plantationEventStart;
