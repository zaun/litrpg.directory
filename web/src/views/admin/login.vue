<template lang="pug">
.grid.mt-4.pt-4
  .col
  .col-4
    p-panel
      template(#header) LitRPG Directory
      .login-content
        p-inlinemessage.mb-3(
          v-if="showError"
          severity="warn"
          :closable="false"
        ) Username or Password is incorrect.
        p-inlinemessage.mb-3(
          v-if="newPassword"
          severity="info"
          :closable="false"
        ) New password is required.
        .p-field
          label.text-sm Username
          p-inputtext(v-model="loginForm.username")
        .p-field.mt-2
          label.text-sm(v-if="newPassword") Old Password
          label.text-sm(v-else) Password
          p-password(
            v-model="loginForm.password"
            :feedback="false")
        .p-field.mt-2(v-if="newPassword")
          label.text-sm New Password
          p-password(
            v-model="loginForm.newPassword"
            :feedback="false")
        p-divider
        .grid
          .col.pb-0.text-right
            p-button(
              @click="login",
              :disabled="validForm || busy",
            ) Login
  .col
</template>

<script>
import { computed, inject, ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'Login',
  components: { },
  setup() {
    const router = useRouter();
    const store = inject('store');

    const newPassword = ref(false);
    const showError = ref(false);
    const busy = ref(false);
    const loginForm = ref({
      username: '',
      password: '',
      newPassword: '',
    });

    const login = () => {
      busy.value = true;
      store.authenticate(
        loginForm.value.username,
        loginForm.value.password,
        loginForm.value.newPassword,
      ).then((code) => {
        busy.value = false;
        showError.value = false;
        newPassword.value = false;
        switch (code) {
          case 'UserNotFoundException':
          case 'NotAuthorizedException':
            showError.value = true;
            break;
          case 'NewPasswordRequired':
            newPassword.value = true;
            break;
          case 'Authenticated':
            router.push({ name: 'admin' });
            break;
          default:
            console.log(code);
            break;
        }
      });
    };

    const validForm = computed(() => {
      if (newPassword.value) {
        return !loginForm.value.username
          || !loginForm.value.password
          || !loginForm.value.newPassword;
      }
      return !loginForm.value.username || !loginForm.value.password;
    });

    return {
      busy,
      showError,
      newPassword,
      loginForm,
      login,
      validForm,
    };
  },
};
</script>

<style>
</style>
