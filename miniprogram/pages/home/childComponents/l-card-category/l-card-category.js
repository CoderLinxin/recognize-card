Component({
  properties: {
    categories: {
      type: Array,
      value: [],
    },
  },

  methods: {
    clickItem(event) {
      const index = event.currentTarget.dataset.index;
      const cardType = this.properties.categories[index].title;
      wx.navigateTo({
        url: `/pages/card-list/card-list?type=${cardType}&index=${index}`,
      });
    },
  },
});
