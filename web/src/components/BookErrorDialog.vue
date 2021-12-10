<template lang="pug">
p-dialog.info-dialog(
  :visible="true",
  modal,
  dismissableMask,
  :draggable="false"
  :closable="true"
  :closeOnEscape="true"
  @update:visible="close()"
)
  template(#header)
    .grid.p-0.m-0(style="flex-basis: 100%;")
      .col-12.p-0.m-0
        .text-xl.title {{ title }}
  p-datatable.info-table(
    :value='items',
    dataKey="id",
    :scrollable="true",
    responsiveLayout="scroll",
    scrollDirection="both"
    scrollHeight="flex",
    sortField="series.name",
    :sortOrder="1",
    showGridlines,
  )
    p-column(
      field='series.name', header="Series Name", :sortable="true",
      style="flex: 1 0 290px;"
    )
      template(#body="{ data }")
        .field {{ data.series.name }}
    p-column(
      field='title', header="Book Name", :sortable="true",
      style="flex: 1 0 290px;"
    )
      template(#body="{ data }")
        .field {{ data.title }}
    p-column(
      field='bookNumber', header="No.", :sortable="false",
      style="flex: 1 0 100px;"
    )
      template(#body="{ data }")
        .field.text-center.m-0.p-0
          .error(
            v-if="isDupe({ series: { id: data.series.id }, bookNumber: data.bookNumber })"
          ) {{ data.bookNumber }}
          span(v-else) {{ data.bookNumber }}
    p-column(
      field='urls', header="URLs", :sortable="false",
      style="flex: 1 0 480px;"
    )
      template(#body="{ data }")
        ul.field(v-if="data.urls.length > 0")
          li(v-for="url in data.urls")
            .error(
              v-if="isDupe({ for: url.for }, data.urls)"
            ) {{ url.for }}
              br
              | {{ url.url }}
            span(v-else) {{ url.for }}
              br
              | {{ url.url }}
        .field.error(v-else) &nbsp;
</template>

<script>
import {
  filter,
} from 'lodash';

export default {
  name: 'BookErrorDialog',
  components: { },
  props: {
    title: String,
    items: Object,
  },
  setup(props, { emit }) {
    const close = () => {
      emit('close');
    };

    const isDupe = (match, list) => filter(list || props.items, match).length > 1;

    return {
      close,
      isDupe,
    };
  },
};
</script>

<style>
.field {
  width: 100%;
  height: 100%;
}
.error {
  background-color: rgba(255, 0, 0, 0.25);
}
.info-dialog.p-dialog .p-dialog-header {
  padding: 1rem;
}
.info-dialog.p-dialog .p-dialog-content {
  padding: 1rem;
  height: 600px;
}
.info-table {
  height: 100%;
}
.info-table .p-datatable-thead th,
.info-table .p-datatable-tbody td.p-frozen-column {
  background-color: rgba(248, 249, 250, 0.95) !important;
}
.info-table .p-datatable-thead {
  z-index: 5 !important;
}
.info-table .p-datatable-thead th.p-frozen-column {
  background-color: rgba(248, 249, 250, 0.95) !important;
}
.info-table .p-datatable-tbody td.p-frozen-column {
  z-index: 2;
}
.info-table .p-datatable-tbody {
  z-index: 1;
}
.info-table .p-datatable-tbody td {
  background-color: transparent !important;
}
.info-table .p-datatable-tbody > tr {
  background: transparent !important;
}
.info-table .p-datatable-tbody > tr:hover {
  background: rgba(248, 249, 250, 0.05) !important;
}
.info-table .p-datatable-loading-overlay {
  background-color: rgba(248, 249, 250, 0.95) !important;
}
.info-table .p-datatable-emptymessage td {
  min-width: 100%;
  height: 0px;
  padding: 0px !important;
}
.info-table .p-rating.text-xs .p-rating-icon {
  font-size: 1rem !important;
}
.info-table .p-dialog-header {
  padding-top: 5px !important;
  padding-bottom: 0px !important;
}
.info-table .p-dialog-content {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}
.info-table .p-dialog-content .p-dataview-grid, .p-dataview-content {
  min-width: 100%;
}
.info-table .p-datatable-wrapper {
  min-height: 100%;
  background-color: rgba(248, 249, 250, 0.75) !important;
}
</style>
