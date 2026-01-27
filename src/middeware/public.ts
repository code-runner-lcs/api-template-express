/**
 * Public routes
 * @type {Array}
 * @property {string} path - The path of the route
 * @property {string} method - The method of the route
 */
export const publicRoutes = [
    { path: '/auth/login', method: 'POST' },
    { path: '/auth/register', method: 'POST' },
    { path: '/auth/ask-password-reset', method: 'POST' },
    { path: '/auth/reset-password', method: 'POST' },
    { path: '/auth/confirm-email', method: 'GET' },
];