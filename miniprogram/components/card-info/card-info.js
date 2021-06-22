Component({
  data: {},
  properties: {
    idInfo: {
      type: Object,
      value: {},
    },
    cards: {
      type: Array,
      value: [],
    },
    index: {
      type: String,
      value: "",
    },
    bankInfo: {
      type: Object,
      value: {},
    },
    showImage: {
      type: Boolean,
      value: true,
    },
    showHeader: {
      type: Boolean,
      value: true,
    },
  },
  methods: {},

  externalClasses: ["my-class"],
});
