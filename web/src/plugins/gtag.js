import VueGtag, { useGtag } from 'vue-gtag-next';

export default (app) => {
  if (process.env.VUE_APP_NO_GTAG === 'true') {
    console.log('Not loading gtag');
    app.provide('track', (name, extraInfo) => {
      console.log('Tracking', name, extraInfo);
    });
    return;
  }
  app.use(VueGtag, {
    property: {
      id: 'G-FZNR6E35MK',
      params: {
        send_page_view: false,
        app_name: 'litRPG.directory',
      },
    },
  });

  app.provide('track', (name, extraInfo) => {
    console.log('Tracking', name, extraInfo);
    useGtag().event(name, extraInfo || {});
  });
};
