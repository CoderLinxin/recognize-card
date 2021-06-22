// 云函数入口文件
const cloud = require("wx-server-sdk");
const {
  ImageClient
} = require("image-node-sdk");
cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  let AppId = "1306306973"; // 腾讯云 AppId
  let SecretId = "AKIDgDXdV7VeYCbnocCXhew4xd3FG4dx3uWt"; // 腾讯云 SecretId
  let SecretKey = "DBtMaYHl012pNirlQs56XlkV3OVO4Vjj"; // 腾讯云 SecretKey

  let fileURL = event.fileURL;
  let imgClient = new ImageClient({
    AppId,
    SecretId,
    SecretKey,
  });

  switch (+event.index) {
    case 0: {
      const result = await imgClient.ocrIdCard({
        data: {
          url_list: [fileURL],
        },
      });
      return JSON.parse(result.body).result_list[0].data;
    }
    case 1: {
      const result = await imgClient.ocrBankCard({
        data: {
          url: fileURL,
        }
      });
      return JSON.parse(result.body);
    }
  }
};