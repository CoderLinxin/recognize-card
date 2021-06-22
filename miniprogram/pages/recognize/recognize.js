const database = wx.cloud.database();
const idCollection = database.collection("idCards");
const bankCollection = database.collection("bankCards");

Page({
  data: {
    title: "",
    copy: "复制信息",
    save: "保存信息",
    idInfo: {
      id: "",
      address: "",
      name: "",
      nation: "",
      sex: "",
      fileID: "",
    },
    bankInfo: {
      cardNum: "",
      cardType: "",
      cardName: "",
      bankName: "",
      fileID: "",
    },
    index: "", // 标识识别的card
    cards: ["身份证", "银行卡"],
  },
  onLoad(option) {
    this.data.index = option.index;
    switch (option.index) {
      case "0":
        this.data.title = "选择身份证";
        break;
      case "1":
        this.data.title = "选择银行卡";
        break;
    }

    this.setData(this.data);
  },

  addCard() {
    // 1.用户选择图片或拍照
    wx.chooseImage({
      count: 1,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
    }).then((result) => {
      this.loadingTips(this.data.cards[this.data.index]);
      // 2.将用户选择的图片或照片上传云存储
      this.uploadFile(result.tempFilePaths[0]);
    });
  },

  // 加载中的提示
  loadingTips(title) {
    wx.showLoading({
      title: `${title}识别中`,
    });
  },

  uploadFile(filePath) {
    const suffix = filePath.substring(filePath.indexOf("."));
    wx.cloud
      .uploadFile({
        filePath, // 小程序临时文件路径
        cloudPath: `images/${new Date().getTime()}${suffix}`,
      })
      .then((result) => {
        // 3.根据fileID获取临时链接
        this.getTempLink(result.fileID);
      });
  },

  getTempLink(fileID) {
    wx.cloud
      .getTempFileURL({
        fileList: [
          {
            fileID,
            maxAge: 60 * 60, // one hour(单位秒)
          },
        ],
      })
      .then((result) => {
        // 4.调用云函数(借助腾讯AI)进行图片识别(根据图片的临时链接)
        this.recognize(result.fileList[0].tempFileURL, fileID);
      });
  },

  recognize(fileURL, fileID) {
    wx.cloud
      .callFunction({
        name: "recognizeCard",
        data: {
          fileURL,
          index: this.data.index, // 根据index来调用对应的卡证识别接口
        },
      })
      .then((result) => {
        switch (+this.data.index) {
          case 0:
            this.handleIDCard(result, fileID);
            break;
          case 1:
            this.handleBankCard(result, fileID);
            break;
        }
      });
  },

  // 身份证识别处理
  handleIDCard(result, fileID) {
    // 判断是否识别失败
    if (!result.result.id) {
      this.deleteImage(fileID); // 识别失败删除对应的图片
      this.showFail("卡证识别失败");
      return;
    }

    // 5.获取识别出来的信息
    const idInfo = {
      id: result.result.id,
      address: result.result.address,
      birth: result.result.birth,
      name: result.result.name,
      nation: result.result.nation,
      sex: result.result.sex,
      fileID,
    };

    // 6.展示信息到界面
    this.setData({
      idInfo,
    });

    wx.hideLoading();
  },

  // 银行卡识别处理
  handleBankCard(result, fileID) {
    const info = result.result.data.items;
    // 判断是否识别失败
    if (info.length < 3) {
      this.deleteImage(fileID); // 识别失败删除对应的图片
      this.showFail("卡证识别失败");
      return;
    }

    // 5.获取识别出来的信息
    const bankInfo = {
      cardNum: info[0].itemstring,
      cardType: info[1].itemstring,
      cardName: info[2].itemstring,
      bankName: info[3].itemstring,
      fileID,
    };

    // 6.展示信息到界面
    this.setData({
      bankInfo,
    });

    wx.hideLoading();
  },

  // 保存卡片信息到数据库
  async save() {
    // 判断卡片类型
    const { cardToken, cardInfo } = this.cardType();

    // 判断是否选择了卡证
    if (cardToken) {
      wx.showLoading({
        title: "保存信息中",
      });

      const result = await this.query(cardToken);
      if (!(result.length > 0)) {
        console.log("添加记录");
        // 记录不存在则添加
        await this.saveInfo(cardInfo);
      } else {
        console.log("替换记录");
        // 记录已存在则更新并且需要删除掉之前的图片
        this.deleteImage(cardInfo.fileID);
        await this.coverInfo(result[0]._id, cardInfo);
      }
    } else {
      // 提示选择一张卡
      this.tip(this.data.cards[this.data.index]);
    }
  },

  // 判断是否存在该记录
  async query(cardToken) {
    let key;
    switch (this.data.cards[this.data.index]) {
      case "身份证": {
        const result = await idCollection
          .where({
            id: cardToken,
          })
          .get();
        return result.data;
      }
      case "银行卡": {
        const result = await bankCollection
          .where({
            cardNum: cardToken,
          })
          .get();
        return result.data;
      }
    }
  },

  // 添加记录
  async saveInfo(cardInfo) {
    // 保存信息到云数据库
    switch (this.getCardType()) {
      case "身份证":
        this.addList(idCollection, cardInfo);
        break;
      case "银行卡":
        this.addList(bankCollection, cardInfo);
        break;
    }
  },

  // 添加一条记录到数据库
  addList(collection, cardInfo) {
    collection
      .add({
        data: cardInfo,
      })
      .then((result) => {
        this.showSuccess();
      });
  },

  // 替换记录
  async coverInfo(_id, cardInfo) {
    switch (this.getCardType()) {
      case "身份证":
        this.setList(idCollection, _id, cardInfo);
        break;
      case "银行卡":
        this.setList(bankCollection, _id, cardInfo);
        break;
    }
  },

  // 替换一条记录
  setList(collection, _id, cardInfo) {
    collection
      .doc(_id)
      .set({
        data: cardInfo,
      })
      .then((result) => {
        this.showSuccess();
      });
  },

  showSuccess(title = "保存信息成功") {
    wx.showToast({
      title,
    });
  },

  showFail(title) {
    wx.showToast({
      title,
    });
  },

  tip(card) {
    wx.showToast({
      icon: "none",
      title: `请选择一张${card}`,
    });
  },

  // 根据fileID删除图片
  deleteImage(fileID) {
    wx.cloud
      .deleteFile({
        fileList: [fileID],
      })
      .then((result) => {
        console.log("删除图片成功~");
      });
  },

  copy() {
    const { cardToken, cardInfo } = this.cardType();

    if (cardToken) {
      wx.setClipboardData({
        data: `${cardToken}`,
      }).then((result) => {
        this.showSuccess("复制信息成功");
      });
    } else {
      this.tip(this.data.cards[this.data.index]);
    }
  },

  getCardType() {
    return this.data.cards[this.data.index];
  },

  // 判断卡片类型
  cardType() {
    const card = this.data.cards[this.data.index];
    let cardInfo;
    let cardToken; // 标识一张卡
    switch (card) {
      case "身份证":
        {
          cardToken = this.data.idInfo.id;
          cardInfo = this.data.idInfo;
        }
        break;
      case "银行卡":
        {
          cardToken = this.data.bankInfo.cardNum;
          cardInfo = this.data.bankInfo;
        }
        break;
    }
    return { cardInfo, cardToken };
  },
});
