// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '/api',  // 使用相對路徑，通過 Nginx 代理
  services: {
    gateway: '/api',
    user: '/api',
    product: '/api',
    order: '/api'
  }
};
