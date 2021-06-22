const database = wx.cloud.database();
const LIMIT = 10;

Page({
  data: {
    cardList: [],
    cardType: "",
    page: 0,
    index: "",
    cards: [],
  },
  onLoad(option) {
    this.data.cardType = option.type;
    this.data.index = option.index;
    switch (option.type) {
      case "身份证":
        {
          this.data.cards.push("身份证");
          this.queryCards("idCards");
        }
        break;
      case "银行卡":
        {
          this.data.cards.push("银行卡");
          this.queryCards("bankCards");
        }
        break;
    }
  },

  onShow() {
    console.log(this.data);
  },

  // 复制卡证信息
  copy(event) {
    const index = event.currentTarget.dataset.index;
    this.getToken(index);
  },

  getToken(index) {
    switch (this.data.cardType) {
      case "身份证":
        this.copyInfo(index, "id");
        break;
      case "银行卡":
        this.copyInfo(index, "carNum");
        break;
    }
  },

  copyInfo(index, token) {
    wx.setClipboardData({
      data: this.data.cardList[index][token],
      success: (result) => {
        wx.showToast({
          title: "复制信息成功",
          icon: "success",
          duration: 1500,
        });
      },
    });
  },

  delete(event) {
    const index = event.currentTarget.dataset.index;
    console.log(index);
    // 删除数据库中的数据
    const _id = this.data.cardList[index]._id;
    wx.cloud
      .database()
      .collection(this.getCollectionName())
      .doc(_id)
      .remove()
      .then((result) => {
        console.log(result);
      });

    // 重新渲染界面
    const oldLists = this.data.cardList;
    oldLists.splice(index, 1);
    console.log(oldLists);
    this.setData({
      cardList: oldLists,
    });
    wx.showToast({
      title: "删除信息成功",
      icon: "success",
      duration: 1500,
    });
  },

  getCollectionName() {
    switch (this.data.cardType) {
      case "身份证":
        return "idCards";
      case "银行卡":
        return "bankCards";
    }
  },

  // 从数据库查询卡证列表
  queryCards(collectionName) {
    const collection = database.collection(collectionName);

    collection
      .skip(this.data.page * LIMIT)
      .limit(LIMIT)
      .get()
      .then((result) => {
        this.data.page++;
        this.data.cardList.push(...result.data);
        this.setData(this.data);
      });
  },
});
