import PrimeVue from 'primevue/config';
import 'primeicons/primeicons.css';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DataView from 'primevue/dataview';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import InlineMessage from 'primevue/inlinemessage';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import OverlayPanel from 'primevue/overlaypanel';
import Panel from 'primevue/panel';
import Password from 'primevue/password';
import Rating from 'primevue/rating';
import SelectButton from 'primevue/selectbutton';
import Toast from 'primevue/toast';
import ToggleButton from 'primevue/togglebutton';
import Toolbar from 'primevue/toolbar';

import ToastService from 'primevue/toastservice';

import 'primeflex/primeflex.css';

export default (app) => {
  app.use(PrimeVue);
  app.use(ToastService);

  app.component('p-button', Button);
  app.component('p-card', Card);
  app.component('p-column', Column);
  app.component('p-datatable', DataTable);
  app.component('p-dataview', DataView);
  app.component('p-dialog', Dialog);
  app.component('p-divider', Divider);
  app.component('p-dropdown', Dropdown);
  app.component('p-inlinemessage', InlineMessage);
  app.component('p-inputnumber', InputNumber);
  app.component('p-inputtext', InputText);
  app.component('p-multiselect', MultiSelect);
  app.component('p-overlaypanel', OverlayPanel);
  app.component('p-panel', Panel);
  app.component('p-password', Password);
  app.component('p-rating', Rating);
  app.component('p-selectbutton', SelectButton);
  app.component('p-toast', Toast);
  app.component('p-togglebutton', ToggleButton);
  app.component('p-toolbar', Toolbar);
};
