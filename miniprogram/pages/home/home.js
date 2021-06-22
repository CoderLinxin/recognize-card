Page({
  data: {
    categories: [
      { title: "身份证", iconPath: "/assets/imgs/zhengjian.png" },
      { title: "银行卡", iconPath: "/assets/imgs/yhk.png" },
    ],
  },
  change(event){
    const index = event.detail.value;
    wx.navigateTo({
      url: `/pages/recognize/recognize?index=${index}`,
    });
  }
});
